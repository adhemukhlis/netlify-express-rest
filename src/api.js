global.fetch = require("node-fetch").default;
const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");
var responseTime = require("response-time");
var routeValidator = require("express-route-validator");
// const path = require("path");
const {
  postHandler,
  getHandler,
  putHandler,
  patchHandler,
  deleteHandler,
  fetchPropertiesByName,
  updateProperties,
  timestamp,
  unixFormat,
  toArrayResponse,
  getName,
} = require("./firerest/core.firerest");
const { success, error } = require("./config/responseApi");

const app = express();
const router = express.Router();
// const routerRoot = express.Router();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseTime());

routeValidator.addValidator("isAllowSync", function (val, config) {
  /**  only allow milliseconds timestamp epoch (13 digits number) example: https://currentmillis.com/ and `true` value*/
  const pattern = config.pattern;
  return pattern.test(val) || val === "true";
});

const fetchUsers = ({ url, res, last_updated }) => {
  getHandler({ url })
    .then(({ data }) => {
      const dataResponse = toArrayResponse(data);
      res.status(200).send(
        success(
          `success get ${getName(url)}!`,
          {
            table_name: getName(url),
            last_updated,
            length: dataResponse.length,
            data: dataResponse,
          },
          res.statusCode
        )
      );
    })
    .catch((error) => {
      res
        .status(500)
        .send(error("something was wrong with firebase!", res.statusCode));
    });
};

const postUsers = ({ url, res, username, email }) => {
  postHandler({
    url,
    data: {
      username,
      email,
      create_at: timestamp,
      last_updated: timestamp,
    },
  }).then(({ status }) => {
    if (status === "success") {
      updateProperties({ name: getName(url), last_updated: timestamp }).then(
        ({ status: prop_update_status }) => {
          if (prop_update_status === "success") {
            res.status(200).send(
              success(
                "OK",
                {
                  data: {
                    username,
                    email,
                  },
                },
                res.statusCode
              )
            );
          } else {
            res.status(500).send(error("something was wrong!", res.statusCode));
          }
        }
      );
    } else {
      res.status(500).send(error("something was wrong!", res.statusCode));
    }
  });
};

const updateUsers = ({ id, username, email }) => {
  return patchHandler({
    url: `/users/${id}`,
    data: {
      username,
      email,
      last_updated: timestamp,
    },
  });
};

const deleteUsers = ({ id }) => {
  return deleteHandler({ url: `/users/${id}.json` });
};

// routerRoot.get("/", (req, res) => {
//   res.sendFile(path.join(__dirname, "/html/index.html"));
// });

router.get("/", (req, res) => {
  const { headers, baseUrl } = req;
  const apiBaseUrl = headers.host + baseUrl;
  res.send({
    status: "OK",
    code: 200,
    message: "success get data!",
    data: {
      baseURL: apiBaseUrl,
      users: `${apiBaseUrl}/users?sync=${timestamp}`,
    },
  });
});
router.get("/timestamp", (req, res) => {
  res.send({ data: `${timestamp}` });
});

router.get(
  "/users",
  routeValidator.validate({
    query: {
      sync: {
        isRequired: true,
        isAllowSync: {
          pattern: unixFormat,
        },
        message: `validation failed!, must include sync query with the 13 digits unix milliseconds epoch format or \`true\` value.`,
      },
    },
  }),
  (req, res) => {
    const { sync } = req.query;
    const pathname = req._parsedUrl.pathname;
    if (sync === "true") {
      fetchPropertiesByName({
        name: getName(pathname),
      })
        .then(({ data: prop_user }) => {
          fetchUsers({
            url: pathname,
            last_updated: prop_user["last_updated"],
            res,
          });
        })
        .catch((err) => {
          console.log("fetchPropertiesByName ERROR sync true");
          console.log(err.message);
        });
    } else {
      fetchPropertiesByName({
        name: getName(pathname),
      })
        .then(({ data: prop_user }) => {
          if (parseInt(sync) >= prop_user["last_updated"]) {
            res.status(200).send({
              message: "Looks like data is up to date, no need to request!",
              status: "success",
              code: 204,
              data: [],
              need_update: false,
              last_updated: prop_user["last_updated"],
              table: getName(pathname),
            });
          } else {
            fetchUsers({
              url: pathname,
              last_updated: parseInt(sync),
              res,
            });
          }
        })
        .catch((err) => {
          console.log("fetchPropertiesByName ERROR sync false");
          console.log(err);
          res.status(500).send(error(err.message, res.statusCode));
        });
    }
  }
);

router.post(
  "/users",
  routeValidator.validate({
    body: {
      username: {
        isRequired: true,
        isByteLength: {
          min: 4,
          max: 32,
        },
      },
      email: {
        isRequired: true,
        isEmail: true,
        normalizeEmail: true,
      },
    },
  }),
  (req, res) => {
    const { username, email } = req.body;
    const pathname = req._parsedUrl.pathname;
    postUsers({ url: pathname, res, username, email });
  }
);

router.put("/users", (req, res) => {
  const { id, ...otherBody } = req.body;
  if (
    Object.keys(req.body).length > 0 &&
    Object.keys(otherBody).length > 0 &&
    Object.keys(req.body).includes("id")
  ) {
    updateUsers({
      id,
      ...otherBody,
    }).then(({ status }) => {
      if (status === "success") {
        updateProperties({ name: "users", last_updated: timestamp }).then(
          ({ status: prop_update_status }) => {
            if (prop_update_status === "success") {
              res.status(200).send(
                success(
                  "OK",
                  {
                    data: {
                      last_updated: timestamp,
                      ...otherBody,
                    },
                  },
                  res.statusCode
                )
              );
            } else {
              res
                .status(500)
                .send(error("something was wrong!", res.statusCode));
            }
          }
        );
      } else {
        res.status(500).send(error("something was wrong!", res.statusCode));
      }
    });
  } else {
    res
      .status(400)
      .send(
        error(`must include '?id' body to update process!`, res.statusCode)
      );
  }
});

router.delete("/users", (req, res) => {
  const { id } = req.body;
  if (
    Object.keys(req.body).length > 0 &&
    Object.keys(req.body).includes("id")
  ) {
    deleteUsers({ id }).then(({ status }) => {
      if (status === "success") {
        updateProperties({ name: "users", last_updated: timestamp }).then(
          ({ status: prop_update_status }) => {
            if (prop_update_status === "success") {
              res.status(200).send(
                success(
                  "OK",
                  {
                    data: {
                      last_updated: timestamp,
                    },
                  },
                  res.statusCode
                )
              );
            } else {
              res
                .status(500)
                .send(error("something was wrong!", res.statusCode));
            }
          }
        );
      } else {
        res.status(500).send(error("request delete failed!", res.statusCode));
      }
    });
  } else {
    res
      .status(500)
      .send(error("request require `id` on body!", res.statusCode));
  }
});

app.use( `/.netlify/functions/api`, router );
// app.use( `/.netlify/functions/`, routerRoot );
//  app.use(`/api`, router);
//  app.use("/", routerRoot);

app.listen(process.env.port || 4000, () => {
  console.log(`listening api ${process.env.port || 4000}`);
});

module.exports = app;
module.exports.handler = serverless(app);

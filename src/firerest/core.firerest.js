const { apiClient } = require("../services/client");

exports.timestamp = Date.now();
exports.unixFormat = new RegExp("^[1-9]([0-9]{12,13}$)");
exports.getName = (str) => str.replace("/", "");
exports.toArrayResponse = (data) =>
  Object.keys(data).map((key) => ({
    ...data[key],
    id: key,
  }));

exports.getHandler = ({ url, headers }) => {
  const config = {
    method: "GET",
    url: `${url}.json`,
    headers: {
      "X-Firebase-ETag": "true",
      ...(!!headers && headers),
    },
  };
  return apiClient(config)
    .then((response) => {
      const { status, statusText, data, headers } = response;
      const { etag } = headers;
      return { code: status, status: statusText, data, etag };
    })
    .catch((error) => {
			const {response, config} = error
      throw {
				status:response.statusText,
				code:response.status,
        message: `something was wrong with firebase! url: ${config.url}`,
      };
    });
};

exports.postHandler = ({ url, headers, data }) => {
  const config = {
    method: "POST",
    url: `${url}.json`,
    data,
    ...(!!headers && {
      headers,
    }),
  };
  return apiClient(config)
    .then(() => {
      return { status: "success" };
    })
    .catch((error) => {
      return {
        status: "failed",
        error: error.toJSON(),
      };
    });
};

exports.putHandler = ({ url, headers, data }) => {
  const config = {
    method: "PUT",
    url: `${url}.json`,
    data,
    ...(!!headers && {
      headers,
    }),
  };
  return apiClient(config)
    .then((response) => {
      return { status: "success" };
    })
    .catch((error) => {
      return {
        status: "failed",
        error: error.toJSON(),
      };
    });
};

exports.patchHandler = ({ url, headers, data }) => {
  const config = {
    method: "PATCH",
    url: `${url}.json`,
    data,
    ...(!!headers && {
      headers,
    }),
  };
  return apiClient(config)
    .then((response) => {
      return { status: "success" };
    })
    .catch((error) => {
      return {
        status: "failed",
        error: error.toJSON(),
      };
    });
};

exports.deleteHandler = ({ url, headers }) => {
  const config = {
    method: "DELETE",
    url: `${url}.json`,
    ...(!!headers && {
      headers,
    }),
  };
  return apiClient(config)
    .then((response) => {
      return { status: "success" };
    })
    .catch((error) => {
      return {
        status: "failed",
        error: error.toJSON(),
      };
    });
};

exports.updateProperties = ({ name, last_updated }) => {
  return this.patchHandler({
    url: `/_properties/${name}`,
    data: {
      name,
      last_updated,
    },
  });
};
exports.fetchPropertiesByName = ({ name }) => {
  return this.getHandler({ url: `/_properties/${name}` })
    .then((response) => response)
    .catch((error) => {
      throw error;
    });
};

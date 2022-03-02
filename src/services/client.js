const axios = require("axios");
const urls = require("../config/api-urls");
const apiClient = axios.create({
  baseURL: urls.BASE_URL,
  responseType: "json",
  // withCredentials: true,
  timeout: 12000,
});

exports.apiClient = apiClient;

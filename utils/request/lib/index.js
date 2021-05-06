'use strict';
const axios = require('axios');

const baseURL = process.env.cli_base_url || 'http://127.0.0.1:7001'
const request = axios.create({
    baseURL: baseURL,
    timeout: 5000,
})
request.interceptors.response.use(function(response) {
    if (response.status === 200) {
        return response.data;
    } else {
        return Promise.reject(response);
    }
}, function(error) {
    return Promise.reject(error)
})


module.exports = request;



import axios from "axios"
import { useMemo } from "react";
import { backend_host_api_url, tokenNameValue } from "./globals";
axios.defaults.headers.common["Accept"] = "application/vnd.api+json";
axios.defaults.headers.common["Content-Type"] = "application/vnd.api+json";

const baseURL = backend_host_api_url;

const instance = axios.create({
    baseURL,
});

instance.interceptors.request.use(function (config) {
    const token = localStorage.getItem(tokenNameValue);
    config.headers.Authorization = `Bearer ${token}`;
    return config;
});

const Api = {
    instance,
    generateDomainToken: async function (domain_id) {
        return instance.post(`/domains/${domain_id}/token`);
    }
}

export default Api
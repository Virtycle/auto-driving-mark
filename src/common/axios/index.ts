import axios, { AxiosResponse } from 'axios';
import { baseURL } from '../api';
import tokenTool from './token';

const axiosInstance = axios.create({
    baseURL,
    timeout: 10000,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = tokenTool.getToken();
        if (token && config.headers) {
            config.headers.Authorization = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

axiosInstance.interceptors.response.use(
    (response) => {
        if (response.data.code === 400) {
            tokenTool.setToken(response.data.token);
        }
        const res = response.data;
        return res;
    },
    (error) => {
        return Promise.reject(error);
    },
);

export default axiosInstance;

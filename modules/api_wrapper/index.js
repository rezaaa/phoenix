import { env, customHeaders } from "../../code/configs";
import { compose } from "node-fetch-middleware";
import Cookies from "js-cookie";

const methods = ["post", "get", "put", "delete", "update", "patch"];
const api = {};

const APICreator = ({ method, token }) => {
  return (endpoint, body) => {
    const isAbsolute = endpoint.toLowerCase().startsWith("http");
    const url = isAbsolute ? endpoint : `${env.APP_API_BASE}${endpoint}`;
    const options = {
      method: method.toUpperCase(),
      ...(body && {body: JSON.stringify(body)}),
      headers: customHeaders
    };

    if (token && typeof token === "string") {
      options.headers["Authorization"] = token;
    }

    const mw = async (url, init, next) => {
      const response = await next(url, init);
      if (
        response.status === 401 &&
        window &&
        "location" in window &&
        window.location.pathname.includes("/dashboard")
      ) {
        window.location = "/login";
        Cookies.remove("REFRESH_TOKEN");
        Cookies.remove("APP_TOKEN");
      }
      return response;
    };

    const customFetch = compose([mw]);

    return customFetch(url, options)
      .then((response) => {
        return response.json().then((data) => {
          return {
            status: response.status,
            statusText: response.statusText,
            data
          };
        });
      })
      .catch((error) => error);
  };
};

const createAPI = ({ token } = {}) => {
  for (let index in methods) {
    const method = methods[index];
    api[method] = APICreator({ method, token });
  }
  return api;
};

// create API wrapper in app init
createAPI();

// we might need to recreate API after user has logged in
// or after setting custom header or some other changes in API structure
export { createAPI };

export default api;

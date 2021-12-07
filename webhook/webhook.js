const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const app = express();
const fetch = require("node-fetch");
const base64 = require("base-64");

let username = "";
let password = "";
let token = "";

let USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
let ENDPOINT_URL = "";
if (USE_LOCAL_ENDPOINT) {
  ENDPOINT_URL = "http://127.0.0.1:5000";
} else {
  ENDPOINT_URL = "http://cs571.cs.wisc.edu:5000";
}

async function getToken() {
  let request = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + base64.encode(username + ":" + password),
    },
  };

  const serverReturn = await fetch(ENDPOINT_URL + "/login", request);
  const serverResponse = await serverReturn.json();
  token = serverResponse.token;

  return token;
}

app.get("/", (req, res) => res.send("online"));
app.post("/", express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res });

  function welcome() {
    agent.add("Hi! Welcome to Wisc Shop. How may I help you?");
  }
  async function getTags() {
    let requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: "follow",
    };
    let response = await fetch(
      ENDPOINT_URL + "/categories/" + agent.parameters.category + "/tags/",
      requestOptions
    );
    let result = await response.json();
    agent.add(
      "The tags for " + agent.parameters.category + " are: " + result.tags
    );
  }
  function cartInfo() {
    agent.add("What kind of information about your cart do you want?");
  }

  async function getCategories() {
    let requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: "follow",
    };

    let response = await fetch(ENDPOINT_URL + "/categories/", requestOptions);
    let result = await response.json();
    agent.add(
      "The different kinds of products we sell are: " + result.categories
    );
  }
  async function typeOfCartItems() {
    let typeOfProducts = [];
    let requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: "follow",
    };
    let response = await fetch(
      ENDPOINT_URL + "/application/products",
      requestOptions
    );
    let result = await response.json();

    if (typeof result.products === "undefined") {
      agent.add("Your cart is empty");
    } else {
      result.products.forEach((element) => {
        typeOfProducts.push(element.category);
      });
      agent.add("The type of product(s) in your cart are " + typeOfProducts);
    }
  }
  async function navToCategories() {
    let category = agent.parameters.category;
    let navUrl = "/" + username + "/" + category;
    console.log(navUrl);
    let body = JSON.stringify({
      dialogflowUpdated: true,
      page: navUrl,
    });
    let requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        body: body,
        "x-access-token": token,
      },
      redirect: "follow",
    };

    let response = await fetch(ENDPOINT_URL + "/application", requestOptions);
    let result = await response.json();
    console.log(result);
    agent.add("Navigating to " + category + "...");
  }
  async function costOfCart() {
    let costOfItems = 0;
    let requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: "follow",
    };
    let response = await fetch(
      ENDPOINT_URL + "/application/products",
      requestOptions
    );
    let result = await response.json();
    console.log(result.products);
    if (typeof result.products === "undefined") {
      agent.add("Your cart is empty");
    } else {
      result.products.forEach((element) => {
        costOfItems += element.price * element.count;
      });
      agent.add("The total cost of product(s) in your cart is " + costOfItems);
    }
  }
  async function productsInCart() {
    let products = [];

    let requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: "follow",
    };
    let response = await fetch(
      ENDPOINT_URL + "/application/products",
      requestOptions
    );
    let result = await response.json();
    if (typeof result.products === "undefined") {
      agent.add("Your cart is empty");
    } else {
      result.products.forEach((element) => {
        products.push(element.count + " x " + element.name);
      });
      agent.add("Your cart contains " + products);
    }
  }
  async function countOfCartItems() {
    let totalProducts = 0;
    let requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: "follow",
    };
    let response = await fetch(
      ENDPOINT_URL + "/application/products",
      requestOptions
    );
    let result = await response.json();
    if (typeof result.products === "undefined") {
      agent.add("Your cart is empty");
    } else {
      result.products.forEach((element) => {
        totalProducts += element.count;
      });
      agent.add("Your cart contains " + totalProducts + " product(s) ");
    }
  }
  async function login() {
    // You need to set this from `username` entity that you declare in DialogFlow
    username = agent.parameters.username;
    // You need to set this from password entity that you declare in DialogFlow
    password = agent.parameters.password;
    agent.add(
      "Attempting to login with " + username + " and " + password + "...."
    );
    let token = await getToken();
    if (typeof token === "undefined") agent.add("login failed");
    else agent.add("login successful");
  }

  let intentMap = new Map();
  intentMap.set("Default Welcome Intent", welcome);
  // You will need to declare this `Login` intent in DialogFlow to make this work
  intentMap.set("Login", login);
  intentMap.set("getCategories", getCategories);
  intentMap.set("getTags", getTags);
  intentMap.set("cartInfo", cartInfo);
  intentMap.set("countOfCartItems", countOfCartItems);
  intentMap.set("typeOfCartItems", typeOfCartItems);
  intentMap.set("costOfCart", costOfCart);
  intentMap.set("productsInCart", productsInCart);
  intentMap.set("navToCategories", navToCategories);
  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080);

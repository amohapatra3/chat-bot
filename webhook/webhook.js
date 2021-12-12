const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const app = express();
const fetch = require("node-fetch");
const base64 = require("base-64");

let username = "";
let password = "";
let token = "";
let productName = "";
let id = 0;
let description = "";
let price = 0;
let category = "";
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

  async function welcome() {
    agent.add("Hi! Welcome to Wisc Shop. How may I help you?");
  }
  async function getTags() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },

      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);

    if (!agent.parameters.category) {
      agent.add("What type of product do you want the tags for?");
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "What type of product do you want the tags for?",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    } else {
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
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text:
            "The tags for " +
            agent.parameters.category +
            " are: " +
            result.tags,
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    }
  }
  async function cartInfo() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    agent.add("What kind of information about your cart do you want?");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "What kind of information about your cart do you want?",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }

  async function getCategories() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
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
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text:
          "The different kinds of products we sell are: " + result.categories,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function typeOfCartItems() {
    let typeOfProducts = [];
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
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
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "Your cart is empty",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    } else {
      result.products.forEach((element) => {
        typeOfProducts.push(element.category);
      });
      agent.add("The type of product(s) in your cart are " + typeOfProducts);
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "The type of product(s) in your cart are " + typeOfProducts,
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    }
  }
  async function deleteAllTags() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",

        "x-access-token": token,
      },

      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/tags", requestOptions);
    agent.add("All filters cleared!!");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "All filters cleared!!",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function filterByTags() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    let filteredProductName = agent.parameters.category;
    if (filteredProductName !== "") {
      let requestOptions = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",

          "x-access-token": token,
        },
        body: JSON.stringify({
          dialogflowUpdated: true,
          page: "/" + username + "/" + filteredProductName,
        }),
        redirect: "follow",
      };

      await fetch(ENDPOINT_URL + "/application", requestOptions);

      agent.add("Navigating to " + filteredProductName + "...");
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "Navigating to " + filteredProductName + "...",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    }
    let tags = [];
    tags = agent.parameters.tags;
    for (let tag of tags) {
      let postRequestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        redirect: "follow",
      };
      await fetch(
        ENDPOINT_URL + "/application/tags/" + tag,
        postRequestOptions
      );
    }

    agent.add("here are the filtered products!");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "here are the filtered products!",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function navBack() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",

        "x-access-token": token,
      },
      body: JSON.stringify({
        back: true,
      }),
      redirect: "follow",
    };

    await fetch(ENDPOINT_URL + "/application", requestOptions);

    agent.add("Navigating to the previous page...");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "Navigating to the previous page...",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function navToSignUp() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",

        "x-access-token": token,
      },
      body: JSON.stringify({
        dialogflowUpdated: true,
        page: "/signUp",
      }),
      redirect: "follow",
    };

    await fetch(ENDPOINT_URL + "/application", requestOptions);

    agent.add("Navigating to sign up page...");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "Navigating to sign up page...",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }

  async function navToSignIn() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",

        "x-access-token": token,
      },
      body: JSON.stringify({
        dialogflowUpdated: true,
        page: "/signIn",
      }),
      redirect: "follow",
    };

    await fetch(ENDPOINT_URL + "/application", requestOptions);

    agent.add("Navigating to sign in page...");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "Navigating to sign in page...",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function navToWelcome() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",

        "x-access-token": token,
      },
      body: JSON.stringify({
        dialogflowUpdated: true,
        page: "/",
      }),
      redirect: "follow",
    };

    await fetch(ENDPOINT_URL + "/application", requestOptions);

    agent.add("Navigating to welcome page...");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "Navigating to welcome page...",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function navToLanding() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",

        "x-access-token": token,
      },
      body: JSON.stringify({
        dialogflowUpdated: true,
        page: "/" + username,
      }),
      redirect: "follow",
    };

    await fetch(ENDPOINT_URL + "/application", requestOptions);

    agent.add("Navigating to landing page...");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "Navigating to landing page...",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function navToCart() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",

        "x-access-token": token,
      },
      body: JSON.stringify({
        dialogflowUpdated: true,
        page: "/" + username + "/cart",
      }),
      redirect: "follow",
    };

    await fetch(ENDPOINT_URL + "/application", requestOptions);

    agent.add("Navigating to your cart...");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "Navigating to your cart...",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function productInfo() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    if (!agent.parameters.products) {
      agent.add("what product do you want information for?");
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "what product do you want information for?",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    } else {
      agent.add("What information about the product do you want?");
      let requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "What information about the product do you want?",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
      productName = agent.parameters.products;
      let getRequestOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        redirect: "follow",
      };
      let request = await fetch(ENDPOINT_URL + "/products", getRequestOptions);
      let response = await request.json();
      response.products.forEach((element) => {
        if (productName.toLowerCase() === element.name.toLowerCase()) {
          id = element.id;
          description = element.description;
          price = element.price;
          category = element.category;
        }
      });
      requestOptions = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",

          "x-access-token": token,
        },
        body: JSON.stringify({
          dialogflowUpdated: true,
          page: "/" + username + "/" + category + "/products/" + id,
        }),
        redirect: "follow",
      };

      await fetch(ENDPOINT_URL + "/application", requestOptions);
    }
  }
  async function productReviews() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    let getRequestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: "follow",
    };
    let request = await fetch(
      ENDPOINT_URL + "/products/" + id + "/reviews",
      getRequestOptions
    );
    let response = await request.json();
    if (response.reviews.length === 0) {
      agent.add("There are no reviews for this product.");
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "There are no reviews for this product.",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    } else {
      let averageRatings = 0;
      let reviews = [];
      response.reviews.forEach((element) => {
        averageRatings += element.stars;
        if (element.text !== "<Product Review Text>") {
          reviews.push(element.text);
        }
      });
      averageRatings = averageRatings / response.reviews.length;
      agent.add(
        "The average rating for the product is " + averageRatings + " stars."
      );
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text:
            "The average rating for the product is " +
            averageRatings +
            " stars.",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
      agent.add("Here's what the reviews say: " + reviews);
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "Here's what the reviews say: " + reviews,
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    }
  }
  async function productTags() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    let getRequestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: "follow",
    };
    let request = await fetch(
      ENDPOINT_URL + "/products/" + id + "/tags",
      getRequestOptions
    );
    let response = await request.json();
    agent.add("Tags for " + productName + " are: " + response.tags);
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "Tags for " + productName + " are: " + response.tags,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function productCategory() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    agent.add("The category for " + productName + " is " + category);
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "The category for " + productName + " is " + category,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function productDescription() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    agent.add(description);
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: description,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function productPrice() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    agent.add(productName + " costs $" + price);
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: productName + " costs $" + price,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function navToCategories() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    let category = agent.parameters.category;
    let navUrl = "/" + username + "/" + category;

    requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",

        "x-access-token": token,
      },
      body: JSON.stringify({
        dialogflowUpdated: true,
        page: navUrl,
      }),
      redirect: "follow",
    };

    await fetch(ENDPOINT_URL + "/application", requestOptions);

    agent.add("Navigating to " + category + "...");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "Navigating to " + category + "...",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }

  async function costOfCart() {
    let costOfItems = 0;
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
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
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "Your cart is empty",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    } else {
      result.products.forEach((element) => {
        costOfItems += element.price * element.count;
      });
      agent.add("The total cost of product(s) in your cart is " + costOfItems);
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "The total cost of product(s) in your cart is " + costOfItems,
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    }
  }
  async function productsInCart() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    let products = [];

    requestOptions = {
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
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "Your cart is empty",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    } else {
      result.products.forEach((element) => {
        products.push(element.count + " x " + element.name);
      });
      agent.add("Your cart contains " + products);
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "Your cart contains " + products,
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    }
  }
  async function addToCart() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    if (!agent.parameters.products) {
      agent.add("What item do you want to add to the cart?");
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "What item do you want to add to the cart?",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    } else if (!agent.parameters.number) {
      agent.add(
        "How many of this item do you want to add to the cart? Enter in digit form"
      );
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "How many of this item do you want to add to the cart? Enter in digit form",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    } else {
      productName = agent.parameters.products;
      let count = agent.parameters.number;
      let getRequestOptions = {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        redirect: "follow",
      };
      let request = await fetch(ENDPOINT_URL + "/products", getRequestOptions);
      let response = await request.json();
      response.products.forEach((element) => {
        if (productName.toLowerCase() === element.name.toLowerCase()) {
          id = element.id;
        }
      });
      for (let i = 0; i < count; ++i) {
        let postRequestOptions = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-access-token": token,
          },
          redirect: "follow",
        };
        await fetch(
          ENDPOINT_URL + "/application/products/" + id,
          postRequestOptions
        );
      }
      agent.add("item(s) added to cart!");
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "item(s) added to cart!",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    }
  }
  async function removeFromCart() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    productName = agent.parameters.products;
    let count = agent.parameters.number;
    let getRequestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: "follow",
    };
    let request = await fetch(
      ENDPOINT_URL + "/application/products",
      getRequestOptions
    );
    let response = await request.json();
    if (typeof response.products === "undefined") {
      agent.add("Cannot remove. Cart is empty.");
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "Cannot remove. Cart is empty.",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    } else {
      response.products.forEach((element) => {
        if (productName.toLowerCase() === element.name.toLowerCase()) {
          id = element.id;
          if (agent.parameters.number === "") count = element.count;
        }
      });
      let requestOptions = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        redirect: "follow",
      };

      for (let i = 0; i < count; ++i) {
        await fetch(
          ENDPOINT_URL + "/application/products/" + id,
          requestOptions
        );
      }
      agent.add("the product has been removed!");
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "the product has been removed",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    }
  }
  async function reviewCart() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",

        "x-access-token": token,
      },
      body: JSON.stringify({
        dialogflowUpdated: true,
        page: "/" + username + "/cart-review",
      }),
      redirect: "follow",
    };

    await fetch(ENDPOINT_URL + "/application", requestOptions);
    agent.add("redirecting you to cart review page..");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "redirecting you to cart review page..",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function confirmCart() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",

        "x-access-token": token,
      },
      body: JSON.stringify({
        dialogflowUpdated: true,
        page: "/" + username + "/cart-confirmed",
      }),
      redirect: "follow",
    };

    await fetch(ENDPOINT_URL + "/application", requestOptions);
    agent.add("redirecting you to cart confirmation page..");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "redirecting you to cart confirmation page..",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function clearCart() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    requestOptions = {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/products", requestOptions);

    agent.add("Your cart has been cleared!");
    requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: false,
        text: "Your cart has been cleared!",
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
  }
  async function countOfCartItems() {
    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        isUser: true,
        text: agent.query,
      }),
      redirect: "follow",
    };
    await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    let totalProducts = 0;
    requestOptions = {
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
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "Your cart is empty",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    } else {
      result.products.forEach((element) => {
        totalProducts += element.count;
      });
      agent.add("Your cart contains " + totalProducts + " product(s) ");
      requestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          isUser: false,
          text: "Your cart contains " + totalProducts + " products",
        }),
        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);
    }
  }
  async function login() {
    // You need to set this from `username` entity that you declare in DialogFlow
    if (!agent.parameters.username) {
      agent.add("What is your username?");
    } else if (!agent.parameters.password) {
      agent.add("What is your password?");
    } else {
      username = agent.parameters.username;

      // You need to set this from password entity that you declare in DialogFlow
      password = agent.parameters.password;
      let token = await getToken();
      let requestOptions = {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },

        redirect: "follow",
      };
      await fetch(ENDPOINT_URL + "/application/messages", requestOptions);

      agent.add(
        "Attempting to login with " + username + " and " + password + "...."
      );

      if (typeof token === "undefined") {
        agent.add("login failed");
      } else {
        agent.add("login successful");
      }
      requestOptions = {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",

          "x-access-token": token,
        },
        body: JSON.stringify({
          dialogflowUpdated: true,
          page: "/" + username + "/",
        }),
        redirect: "follow",
      };

      await fetch(ENDPOINT_URL + "/application", requestOptions);
    }
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
  intentMap.set("productInfo", productInfo);
  intentMap.set("productCategory", productCategory);
  intentMap.set("productDescription", productDescription);
  intentMap.set("productPrice", productPrice);
  intentMap.set("productTags", productTags);
  intentMap.set("productReviews", productReviews);
  intentMap.set("filterByTags", filterByTags);
  intentMap.set("deleteAllTags", deleteAllTags);
  intentMap.set("clearCart", clearCart);
  intentMap.set("addToCart", addToCart);
  intentMap.set("removeFromCart", removeFromCart);
  intentMap.set("reviewCart", reviewCart);
  intentMap.set("confirmCart", confirmCart);
  intentMap.set("navBack", navBack);
  intentMap.set("navToCart", navToCart);
  intentMap.set("navToSignUp", navToSignUp);
  intentMap.set("navToSignIn", navToSignIn);
  intentMap.set("navToWelcome", navToWelcome);
  intentMap.set("navToLanding", navToLanding);

  agent.handleRequest(intentMap);
});

app.listen(process.env.PORT || 8080);

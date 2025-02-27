import React, { useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import { getCurrentUser, signOut } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/api";
import awsExports from "./aws-exports";
import { listRestaurants } from "./graphql/queries";
import { createRestaurant, deleteRestaurant } from "./graphql/mutations";
import { withAuthenticator } from "@aws-amplify/ui-react";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

Amplify.configure(awsExports);
const API = generateClient();

function App() {
  const [user, setUser] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [newRestaurant, setNewRestaurant] = useState({ name: "", description: "" });

  useEffect(() => {
    getCurrentUser()
      .then((userData) => setUser(userData))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const restaurantData = await API.graphql({ query: listRestaurants });
      setRestaurants(restaurantData.data.listRestaurants.items);
    } catch (error) {
      console.error("Error fetching restaurants", error);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    if (!newRestaurant.name || !newRestaurant.description) {
      console.error("Restaurant name and description are required!");
      return;
    }

    if (!user || !user.username) {
      console.error("User is not authenticated or username is missing");
      return;
    }

    try {
      const input = {
        name: newRestaurant.name,
        description: newRestaurant.description,
        owner: user.username,
      };

      console.log("Creating restaurant with input:", input);

      const result = await API.graphql({
        query: createRestaurant,
        variables: { input },
      });

      console.log("Restaurant created successfully:", result);
      setNewRestaurant({ name: "", description: "" });
      fetchRestaurants();
    } catch (error) {
      console.error("Error creating restaurant:", JSON.stringify(error, null, 2));
    }
  };

  const handleRemoveRestaurant = async (id) => {
    try {
      await API.graphql({
        query: deleteRestaurant,
        variables: { input: { id } },
      });

      console.log(`Restaurant with id ${id} deleted`);
      setRestaurants(restaurants.filter((restaurant) => restaurant.id !== id));
    } catch (error) {
      console.error("Error deleting restaurant:", JSON.stringify(error, null, 2));
    }
  };

  return (
    <div
      style={{
        backgroundImage:
          'url(https://plus.unsplash.com/premium_photo-1739142431084-569c75c145db?q=80&w=1670&auto=format&fit=crop&ixlib=rb-4.0.3)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        padding: '20px',
      }}
    >
      <div
        className="container d-flex justify-content-center align-items-center"
        style={{
          minHeight: '100vh', 
        }}
      >
        <div className="card p-4 shadow bg-light" style={{ width: '100%', maxWidth: '600px' }}>
          <h1 className="text-center my-4 text-dark">Welcome to IM 2025 Yelp App</h1>

          {user ? (
            <div>
              <p className="text-dark">Welcome, {user.signInDetails.loginId || user.username}!</p>

              <div className="mb-4">
                <h2>Create a New Restaurant</h2>
                <form onSubmit={handleCreateRestaurant}>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="restaurantName">
                      Restaurant Name
                    </label>
                    <input
                      type="text"
                      id="restaurantName"
                      className="form-control"
                      placeholder="Restaurant Name"
                      value={newRestaurant.name}
                      onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="restaurantDescription">
                      Description
                    </label>
                    <input
                      type="text"
                      id="restaurantDescription"
                      className="form-control"
                      placeholder="Description"
                      value={newRestaurant.description}
                      onChange={(e) =>
                        setNewRestaurant({ ...newRestaurant, description: e.target.value })
                      }
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary w-100">
                    Add Restaurant
                  </button>
                </form>
              </div>

              <div className="card p-4 shadow bg-light">
                <h2>Restaurants</h2>
                <ul className="list-group">
                  {restaurants.map((restaurant) => (
                    <li
                      key={restaurant.id}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{restaurant.name}</strong> - {restaurant.description}
                      </div>
                      <button
                        onClick={() => handleRemoveRestaurant(restaurant.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <button className="btn btn-danger mt-4 w-100" onClick={() => signOut()}>
                Sign Out
              </button>
            </div>
          ) : (
            <p className="text-center mt-4 text-dark">Please sign in to add restaurants.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default withAuthenticator(App);

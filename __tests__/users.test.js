import pool from '../lib/utils/pool.js';
import setup from '../data/setup.js';
import request from 'supertest';
import app from '../lib/app.js';
import Favorite from '../lib/models/Favorite';
import Drink from '../lib/models/Drink';

const agent = request.agent(app);

describe('user routes', () => {
  beforeAll(() => {
    return setup(pool);
  });

  afterAll(() => {
    return pool.end();
  });

  it('creates a user via POST', async () => {
    const res = await agent.post('/api/v1/auth/signup').send({
      email: 'cupajoe@aol.com',
      password: 'coffee123',
    });
    expect(res.body).toEqual({
      id: '1',
      email: 'cupajoe@aol.com',
      username: null,
    });
  });

  it('logs in a user via POST', async () => {
    const res = await agent.post('/api/v1/auth/login').send({
      email: 'cupajoe@aol.com',
      password: 'coffee123',
    });
    expect(res.body).toEqual({
      id: '1',
      username: null,
      email: 'cupajoe@aol.com',
    });
  });

  it('user can add fav drink via POST', async () => {
    const user = {
      email: 'cupajoe@aol.com',
      password: 'coffee123',
    };

    const addedDrink = await Drink.insert({
      drinkName: 'Americano',
      brew: 'drip',
      description: 'Best coffee ever',
      ingredients: ['Coffee'],
      postId: '1',
    });
    const loggedUser = await agent.post('/api/v1/auth/login').send(user);
    const res = await agent
      .post('/api/v1/auth/favorites')
      .send({ drinkId: addedDrink.id });

    expect(res.body).toEqual({
      drinkId: addedDrink.id,
      userId: loggedUser.body.id,
    });
  });

  it('gets a users favorite coffees via GET', async () => {
    const user = {
      email: 'cupajoe@aol.com',
      password: 'coffee123',
    };

    const regularDrink = {
      drinkName: 'Latte',
      brew: 'Espresso',
      description: 'xyz',
      ingredients: ['Espresso', 'Milk'],
    };

    const favoriteDrink = {
      drinkName: 'Americano',
      brew: 'Espresso',
      description: 'xyz',
      ingredients: ['Espresso', 'Milk'],
    };

    await Drink.insert(regularDrink);
    const drink = await Drink.insert(favoriteDrink);

    const loggedUser = await agent.post('/api/v1/auth/login').send(user);
    await Favorite.add(loggedUser.body.id, drink.id);

    // This was previously testing a POST route while your
    // test is describing a GET route
    const res = await agent.get('/api/v1/auth/favorites');

    // Make sure you're testing the response.
    // Because your database isn't being cleared between tests,
    // you can use a different Jest matcher to make sure
    // your response includes the favorite that was added
    // https://jestjs.io/docs/next/expect#expectarraycontainingarray
    expect(res.body).toEqual(
      expect.arrayContaining([{ drink_name: favoriteDrink.drinkName }])
    );
  });

  it('users can add drinks under their account via POST', async () => {
    const user = await agent.post('/api/v1/auth/login').send({
      username: 'CupAJoe',
      email: 'cupajoe@aol.com',
      password: 'coffee123',
    });

    const userDrink = {
      drinkName: 'Latte',
      brew: 'Espresso',
      description: 'xyz',
      ingredients: ['Espresso', 'Milk'],
      postId: user.body.id,
    };

    const res = await agent
      .post('/api/v1/auth/drinks')
      .send(userDrink, user.body.id);

    expect(res.body).toEqual({
      id: res.body.id,
      ...userDrink,
    });
  });

  it('user can update their own posts via PUT', async () => {
    const user = await agent.post('/api/v1/auth/login').send({
      email: 'cupajoe@aol.com',
      password: 'coffee123',
    });

    const userDrink = {
      drinkName: 'Latte',
      brew: 'Espresso',
      description: 'xyz',
      ingredients: ['Espresso', 'Milk'],
    };

    const updateDrink = {
      drinkName: 'Chai Latte',
      brew: 'Espresso',
      description: 'Chai Latte',
      ingredients: ['Milk', 'Tea'],
    };

    const drink = await Drink.insert({
      ...userDrink,
      postId: user.body.id,
    });

    const updatedDrinkInfo = await agent
      .put(`/api/v1/auth/drinks/${drink.id}`)
      .send({ ...updateDrink });

    expect(updatedDrinkInfo.body).toEqual({
      id: drink.id,
      ...updateDrink,
      postId: user.body.id,
    });
  });

  it('should delete a drink post by ID via DELETE', async () => {
    const user = await agent.post('/api/v1/auth/login').send({
      username: 'CupAJoe',
      email: 'cupajoe@aol.com',
      password: 'coffee123',
    });
    const userDrink = {
      drinkName: 'Latte',
      brew: 'Espresso',
      description: 'xyz',
      ingredients: ['Espresso', 'Milk'],
      postId: user.body.id,
    };
    const drink = await Drink.insert({
      ...userDrink,
      postId: user.body.id,
    });

    const res = await agent.delete(`/api/v1/auth/drinks/${drink.id}`);

    expect(res.body).toEqual({ ...drink });
  });
});

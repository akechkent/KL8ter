var express = require('express');
var router = express.Router();
var ctrlLocations = require('../controllers/locations');
var ctrlAuth = require('../controllers/authentication');
var jwt = require('express-jwt');
var auth = jwt({
  secret: process.env.JWT_SECRET,
  userProperty: 'payload'
})
//var ctrlReviews = require('../controllers/reviews');
// locations
router.get('/locations', ctrlLocations.listLocationsByDistance);
router.post('/locations', ctrlLocations.createLocation);
router.get('/locations/:locationid', ctrlLocations.getLocation);
router.put('/locations/:locationid', ctrlLocations.updateLocation);
router.delete('/locations/:locationid', ctrlLocations.deleteLocation);
// reviews
router.post('/locations/:locationid/reviews', ctrlLocations.reviewsCreate);
router.get('/locations/:locationid/reviews/:reviewid',ctrlLocations.getReview);
router.put('/locations/:locationid/reviews/:reviewid', ctrlLocations.updateReview);
router.delete('/locations/:locationid/reviews/:reviewid',ctrlLocations.deleteReview);
//api/app
router.post('/register', ctrlAuth.register);
router.post('/login', ctrlAuth.login);

module.exports = router;

require('../models/locations');
var util = require('util');




var updateAverageRating = function (locationId) {
  locations.findById(locationId).select('rating reviews').exec(function(err,location) {
    if(!err) {
      var i, count, total;
      if(location.reviews && (location.reviews.length > 0)) {
        total = 0;
        count = location.reviews.length;
        for(i = 0;i < count;i++) {
          total += location.reviews[i].rating;
        }
        location.rating = parseInt(total / count,10);
        locations.save(function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("Average rating updated to ",location.rating);
          }
        });
      }
    }
  });
}; //updateAverageRating

var sendJSONResponse = function (res,status,content) {
  res.status(status);
  res.json(content);
}; //sendJSONResponse



/* GET list of locations */
var meterConversion = (function() {
  var mToKm = function(distance) {
      return parseFloat(distance / 1000);
  };
  var kmToM = function(distance) {
      return parseFloat(distance * 1000);
  };
  return {
      mToKm : mToKm,
      kmToM : kmToM
  };
})();

/* GET list of locations */
module.exports.listLocationsByDistance = function(req, res) {
  console.log('listLocationsByDistance:');
  var lng = -1.2920658999999998;
  var lat = 36.82194619999997;
  var maxDistance = 4444;
  
  var point = {
      type: "Point",
      coordinates: [lng, lat]
  };
  var geoOptions =  {
      spherical: true,
      maxDistance: meterConversion.kmToM(maxDistance),
      num: 20
  };

  console.log('geoOptions: ' + geoOptions);
  if ((!lng && lng!==0) || (!lat && lat!==0) || ! maxDistance) {
    console.log('locationsListByDistance missing params');
    sendJSONResponse(res, 404, {
      "message": "lng, lat and maxDistance query parameters are all required"
    });
    return;
  } else {
    console.log('locationsListByDistance running...');
    locations.aggregate(
      [{
        '$geoNear': {
          'near': point,
          'spherical': true,
          'coords': [-1.2920658999999998,36.82194619999997],
          'distanceField': 'dist.calculated',
          'maxDistance': maxDistance
        }
      }],
      function(err, results) {
        if (err) {
          sendJSONResponse(res, 404, err);
        } else {
          locations = buildLocationList(req, res, results);
          sendJSONResponse(res, 200, locations);
        }
      }
    )
  };
};

var buildLocationList = function(req, res, results) {
  console.log('buildLocationList:');
  var locations = [];
  results.forEach(function(doc) {
      locations.push({
        distance: doc.dist.calculated,
        name: doc.name,
        address: doc.address,
        rating: doc.rating,
        facilities: doc.facilities,
        _id: doc._id
      });
  });
  return locations;
}; //listLocationsByDistance

module.exports.createLocation = function(req,res) {
  locations.create({
    name: req.body.name,
    address: req.body.address,
    facilities: req.body.facilities,
    coords: [parseFloat(req.body.lng),parseFloat(req.body.lat)],
    hours: [{
      days: req.body.days1,
      opening: req.body.opening1,
      closing: req.body.closing1,
      closed: req.body.closed1
    },{
      days: req.body.days2,
      opening: req.body.opening2,
      closing: req.body.closing2,
      closed: req.body.closed2
    }]
  },function(err,location) {
    if(!err) {
      sendJSONResponse(res,201,location);
    } else {
      sendJSONResponse(res,400,err);
    }
  })
}; //createLocation

module.exports.getLocation = function(req,res) {
  if (req.params && req.params.locationid) {
    locations
    .findById(req.params.locationid)
    .exec(function(err, location) {
    if (!location) {
      sendJSONResponse(res, 404, {
    "message": "locationid not found"
    });
    return;
    } else if (err) {
      sendJSONResponse(res, 404, err);
    return;
    }
    sendJSONResponse(res, 200, location);
    });
    } else {
      sendJSONResponse(res, 404, {
    "message": "No locationid in request"
    });
    }
   };
 //getLocation

module.exports.updateLocation = function(req,res) {
	if(req.params.locationId) {
    locations.findById(req.params.locationId).select('-reviews -rating').exec(function(err,location) {
      if(err) {
        sendJSONResponse(res,400,err);
      } else if(location) {
        location.name = req.body.name;
        location.address = req.body.address;
        location.facilities = req.body.facilities.split(',%s*');
        location.geocode = [parseFloat(req.body.lng),parseFloat(req.body.lat)];
        location.hours = [{
          days: req.body.days1,
          opening: req.body.opening1,
          closing: req.body.closing1,
          closed: req.body.closed1
        },{
          days: req.body.days2,
          opening: req.body.opening2,
          closing: req.body.closing2,
          closed: req.body.closed2
        }];
        location.save(function(err,location) {
          if(err) {
            sendJSONResponse(res,400,err);
          } else {
            sendJSONResponse(res,200,location);
          }
        })
      } else {
        sendJSONResponse(res,404,{"error": "location.not.found","message": "Location ID " + req.params.locationId + " not found"});
      }
    });
  } else {
    sendJSONResponse(res,400,{"error": "locationId.missing","message": "No Location ID was found in the request"});
  }
}; //updateLocation

module.exports.deleteLocation = function(req,res) {
	var locationid = req.params.locationid;
 if (locationid) {
 
  locations.findByIdAndRemove(locationid)
 .exec(
 function(err, location) {
 if (err) {
  sendJSONResponse(res, 404, err);
 return;
 }
 sendJSONResponse(res, 204, null);
 }
 );
 } else {
  sendJSONResponse(res, 404, {
 "message": "No locationid"
 });
 }
}; //deleteLocation

module.exports.reviewsCreate = function(req,res) {
	if(req.params.locationid) {
    locations.findById(req.params.locationid).select('reviews').exec(function(err,location) {
      if(err) {
        sendJSONResponse(res,400,err);
      } else if(location) {
        location.reviews.push({
          author: req.body.author,
          rating: req.body.rating,
          timestamp: Date.now(),
          reviewText: req.body.reviewText
        });
        location.save(function(err,location) {
          if(err) {
            console.log(err);
            sendJSONResponse(res,400,err);
          } else {
            updateAverageRating(location._id);
            sendJSONResponse(res,201,location.reviews[location.reviews.length - 1]);
          }
        });
      } else {
        sendJSONResponse(res,404,{"error": "location.not.found","message": "Location ID " + req.params.locationid + " not found"});
      }
    });
  } else {
    sendJSONResponse(res,400,{"error": "locationId.missing","message": "No Location ID was found in the request"});
  }

}; //createReview 

module.exports.getReview = function(req,res) {
  if (req.params && req.params.locationid && req.params.reviewid) {
    locations
    .findById(req.params.locationid)
    .select('name reviews')
    .exec(
    function(err, location) {
    var response, review;
    if (!location) {
      sendJSONResponse(res, 404, {
    "message": "locationid not found"
    });
    return;
    } else if (err) {
      sendJSONResponse(res, 400, err);
    return;
    }
    if (location.reviews && location.reviews.length>0) {
    review = location.reviews.id(req.params.reviewid);
    if (!review) {
      sendJSONResponse(res, 404, {
    "message": "reviewid not found"
    });
    } else {
    response = {
    location : {
    name : location.name,
    id : req.params.locationid
    
    },
    review : location.reviews
    };
    sendJSONResponse(res, 200, response);
    }
    } else {
      sendJSONResponsee(res, 404, {
    "message": "No reviews found"
    });
    }
    }
    );
    } else {
    sendJSONResponse(res, 404, {
    "message": "Not found, locationid and reviewid are both required"
    });
    }
   }; 
 //getReview

module.exports.updateReview = function(req,res) {
	if(req.params && req.params.locationId && req.params.reviewId) {
    locations.findById(req.params.locationId).select('reviews').exec(function(err,location) {
      if(err) {
        sendJSONResponse(res,400,err);
      } else if(location) {
        if(location.reviews && (location.reviews.length > 0)) {
          var review = location.reviews.id(req.params.reviewId);
          if(review) {
            review.author = req.body.author;
            review.rating = req.body.rating;
            review.comments = req.body.comments;
            locations.save(function(err,location) {
              if(err) {
                sendJSONResponse(res,400,err);
              } else {
                updateAverageRating(location._id);
                sendJSONResponse(res,200,review);
              }
            });
          } else {
            sendJSONResponse(res,404,{"error": "review.not.found","message": "Review ID " + req.params.reviewId + " not found for location " + req.params.locationId});
          }
        }
      } else {
        sendJSONResponse(res,404,{"error": "location.not.found","message": "Location ID " + req.params.locationId + " not found"});
      }
    });
  } else {
    sendJSONResponse(res,400,{"error": "locationId.reviewId.missing","message": "LocationId and/or ReviewId missing"});
  }
}; //updateReview

module.exports.deleteReview = function(req,res) {
	if (!req.params.locationid || !req.params.reviewid) {
    sendJSONResponse(res, 404, {
    "message": "Not found, locationid and reviewid are both required"
    });
    return;
    }
    locations
    .findById(req.params.locationid)
    .select('reviews')
    .exec(
    function(err, location) {
    if (!location) {

      sendJSONResponse(res, 404, {
    "message": "locationid not found"
    });
    return;
    } else if (err) {
      sendJSONResponse(res, 400, err);
    return;
    }
    if (location.reviews && location.reviews.length > 0) {
    if (!location.reviews.id(req.params.reviewid)) {
      sendJSONResponse(res, 404, {
    "message": "reviewid not found"
    });
    } else {
    location.reviews.id(req.params.reviewid).remove();
    locations.save(function(err) {
    if (err) {
      sendJSONResponse(res, 404, err);
    } else {
    updateAverageRating(location._id);
    sendJsonResponse(res, 204, null);
    }
    });
    }
    } else {
    sendJSONResponse(res, 404, {
    "message": "No review to delete"
    });
    }
    }
    );
   }; //deleteReview

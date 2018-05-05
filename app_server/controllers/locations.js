var request = require('request');

var apiOptions = {
  server: "http://localhost:3000"
};

if(process.env.NODE_ENV === 'production') {
  apiOptions.server = "http://planetpratt.com:3000";
}

var _isNumeric = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

var _formatDistance = function (distance) {
  var numDistance, unit;
  if (distance && _isNumeric(distance)) {
    if (distance > 1) {
      numDistance = parseFloat(distance).toFixed(1);
      unit = 'km';
    } else {
      numDistance = parseInt(distance * 1000,10);
      unit = 'm';
    }
    return numDistance + unit;
  } else {
    return "?";
  }
}; //formatDistance

var _showError = function (req,res,status) {
  var data;
  if(status === 404) {
    data = {
      title: "404: Page Not Found",
      content: "WTF? Looks like we can't find that page.  OFW!"
    };
  } else {
    data = {
      title: status + ": Request Error",
      content: "Something, somewhere, has gone horribly wrong."
    };
  }
  res.status(status);
  res.render("generic-text",data);
}; //_showError

var renderHomepage = function(req, res){
  res.render('locations-list', {
  title: 'KLoc8ta - find a place to work with wifi',
  pageHeader: {
  title: 'KLoc8ta',
  strapline: 'Find places  with wifi near you!'
  },
  sidebar: "Looking for wifi and a seat? KentLoc8ta helps you find places towork when out and about. Perhaps with coffee, cake or a pint? Let KentLoc8r help you find the place you're looking for."
  });
 }; //renderHomepage

/* GET 'home' page */
module.exports.homelist = function(req, res){
 renderHomepage(req, res);
}; //homelist



/* GET 'Location Info' page */
 //locationInfo
 var renderDetail = function (req,res,data) {
  res.render("location-info",{
    title: data.name,
    pageHeader: {
      title: data.name
    },
    sidebar: {
      context: "is on kentloc8ta because it has accessible wifi and space to sit down with your laptop and get some work done.",
      callToAction: "If you've been and you like it - or if you don't - please leave a review to help other people just like you."
    },
    location: data
  });
}; 

var getLocationInfo = function (req,res,callback) {
  request({
    url: "http://127.0.0.1:3000/api/locations/" + req.params.locationid,
    method: "GET",
    json: {}
  },function(err,response,body) {
    if(response.statusCode === 200) {
      body.coords = {
        lng: body.coords[0],
        lat: body.coords[1]
      };
      callback(req,res,body);
    } else {
      _showError(req,res,response.statusCode);
    }
  });
}; 
//'Location Info' page */
module.exports.locationInfo = function (req,res) {
  getLocationInfo(req,res,function(req,res,data) {
    renderDetail(req,res,data);
  });
};
//renderDetail
var renderReviewForm = function (req, res, data) {
  res.render('location-review-form', {
  title: 'Review ' + data.name + ' on KLoc8ta',
  pageHeader: { title: 'Review ' + data.name },
  error: req.query.err, 
  url: req.originalUrl
  });
 }; //renderReviewForm

/* GET 'Add Review' page */
module.exports.addReview = function (req,res) {
  getLocationInfo(req,res,function(req,res,data) {
    renderReviewForm(req,res,data);
    
  });
};//createReview*/
module.exports.createReview = function (req,res) {

var requestOptions, locationid, postdata;
  locationid = req.params.locationid;
  postdata = {
    author: req.body.name,
    rating: parseInt(req.body.rating, 10),
    reviewText: req.body.review
  };
  requestOptions = {
    url :  "http://127.0.0.1:3000/api/locations/" + locationid + '/reviews',
    method : "POST",
    json : postdata
  };
  if (!postdata.author || !postdata.rating || !postdata.reviewText) {
    res.redirect('/location/' + locationid + '/reviews/new?err=val');
  } else {
    request(
      requestOptions,
      function(err, response, body) {
        if (response.statusCode === 201) {
          res.redirect('/location/' + locationid);
        } else if (response.statusCode === 400 && body.name && body.name === "ValidationError" ) {
          res.redirect('/location/' + locationid + '/reviews/new?err=val');
        } else {
          console.log(body);
          _showError(req, res, response.statusCode);
        }
      }
    );
  }
};
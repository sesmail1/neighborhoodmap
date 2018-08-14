//Initialize Leaflet map
//Zoom and Area with access token

var mymap = L.map('mapid').setView([33.9585, -83.3755], 18);
var accessToken = 'pk.eyJ1Ijoic2VzbWFpbDEiLCJhIjoiY2prbGs1ZWN1MHRxdTN2cGp1aGFjdmo2ayJ9.DWB5DDCapUg1sK3fdTOATA';
L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.streets',
    accessToken: 'pk.eyJ1Ijoic2VzbWFpbDEiLCJhIjoiY2prbGs1ZWN1MHRxdTN2cGp1aGFjdmo2ayJ9.DWB5DDCapUg1sK3fdTOATA'
}).addTo(mymap);

//Data to start with

var bars = [{
        title: 'Nowhere Bar',
        location: {
            lat: 33.958686,
            lng: -83.377040
        }
    },
    {
        title: 'The Globe',
        location: {
            lat: 33.958014,
            lng: -83.377219
        }
    },
    {
        title: 'Blue Sky Bar',
        location: {
            lat: 33.957995,
            lng: -83.374917
        }
    },
    {
        title: 'Jerzees Sportsbar',
        location: {
            lat: 33.958585,
            lng: -83.373634
        }
    },
    {
        title: 'Blind Pig Tavern',
        location: {
            lat: 33.959564,
            lng: -83.374429
        }
    }
];

//Creating a Leaflet layer group to contain all markers later created in init()

var markerGroup = L.layerGroup().addTo(mymap);


//KnockoutJS observables and integral functionality for view defined here

function viewModel(bars) {
    var self = this;
    self.query = ko.observable('');
    self.currentClicked = ko.observable();
    self.mapList = ko.observableArray(bars);
    self.clicklisthandler = function (bar) {
        leaflet_Connector(leaflet_Cross_Reference, bar);
        markerGroup._layers[self.currentLeaf().leaflet_id].bounce().openPopup();
        $('li a').removeClass('active');
        self.currentClicked(bar);
        self.dataGrab();
    };
    self.filteredList = ko.computed(function () {
        if (self.query() == '') {
            return self.mapList();
        };
        return self.mapList().filter((bar) => {
            if (bar.title.toLowerCase().includes(self.query().toLowerCase())) {
                return bar;
            };
        });
    });
    self.dataGrab = function () {
        fs_data(self.currentClicked());
    };
    self.nameCurrent = ko.observable();
    self.addressCurrent = ko.observable();
    self.ratingCurrent = ko.observable();
    self.servesCurrent = ko.observable();
    self.currentLeaf = ko.observable();
};

//Assigning the view model to the window for reference when application runs

window.viewModel = new viewModel(bars);

//Requesting information from Zomato API about bars clicked on map or list
//Passing in data from the observable self.currentClicked

//Using jQuery's Ajax method
function fs_data(data) {
    $.ajax({
        method: "GET",
        crossDomain: true,
        url: `https://developers.zomato.com/api/v2.1/search?count=1&lat=${data.location.lat}&lon=${data.location.lng}&q=${data.title}`,
        dataType: "json",
        async: true,
        headers: {
            "user-key": "f8493fbb074def6bc9a0e77a34faab96"
        },
        success: function (data) {
            // For purposes of review, from myself and reviewer from Udacity, to see data.
            console.log(data);

            // Choosing the first relevant location
            let ref = data.restaurants[0].restaurant;

            function currentInfo() {
                return {
                    name: ref.name,
                    address: ref.location.address,
                    rating: ref.user_rating.aggregate_rating,
                    serves: ref.cuisines
                }
            };

            // Updating the View Model
            window.viewModel.nameCurrent(currentInfo().name)
                .addressCurrent(currentInfo().address)
                .ratingCurrent(currentInfo().rating)
                .servesCurrent(currentInfo().serves);
        },
        // Handling potential errors in the request
        error: function (err) {
            console.log('failed to retrieve data from zomato');
            console.log(err);
            window.viewModel.nameCurrent('error')
                .addressCurrent('error')
                .ratingCurrent('error')
                .servesCurrent('error');
        }
    });
};


//Creating a variable to cross reference all markers created by leaflet to the list being maintained by KnockoutJS

var leaflet_Cross_Reference = [];

//Initialize the application

function init() {
    
    window.viewModel.filteredList().forEach((bar, index) => {
        var markers = L.marker([bar.location.lat, bar.location.lng]).addTo(markerGroup).bindPopup(`${bar.title}`).setBouncingOptions({
            exclusive: true, // if this marker bouncing all others must stop
        });
        markers.on('click', function () {
            //making sure that clicking anywhere, whether map or list has consistency in highlighting
            $('li a').removeClass('active');
            window.viewModel.clicklisthandler(bar);
            window.viewModel.currentClicked(bar);
            window.viewModel.dataGrab();
            this.bounce(); 
            $('li a').eq(index).addClass('active');
        });
        // populating the cross reference variable instantiated earlier
        markers.initial = function() {
            let obj = {
                title: this._popup._content,
                leaflet_id: this._popup._source._leaflet_id
            };
            leaflet_Cross_Reference.push(obj)
        }

        //Calling the function, for clarity did not use an immediately invoked function, looked messy.
        markers.initial();
    });


}

// Handling comparisons between the list of locations initially populated into the VM
    // and then comparing to Leaflet's mapped locations
        // in order to animate the proper markers

function leaflet_Connector(leaflet_Cross_Reference, bar) {
    leaflet_Cross_Reference.forEach((leaf) => {
        if(bar.title == leaf.title) {
            window.viewModel.currentLeaf(leaf)
        };
    });
};

// Initializing the application

init();



// Applying KnockoutJS bindings

ko.applyBindings(window.viewModel);
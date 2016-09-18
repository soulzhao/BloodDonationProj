/**
 * Created by Soul on 2016/9/7.
 */
define([
    "dojo/request",
    "esri/geometry/Point",
    "root-view"
], function(
    request,
    GeoPoint,
    app
){
    "use strict";
    var patientView = {
        rawMapView: null,
        singleDialog: null,
        pinPoints: [],
        donations: [],
        request_route: "patient/",
        last_center: {
            longitude: 0,
            latitude:0
        },
        socket: null,

        init: function () {
            this.rawMapView =
                app.functions.createRawMapView("patientViewDiv");
            app.components.createLocateWidget(this.rawMapView);

            // Views - Listen to view size changes to show/hide panels
            this.rawMapView.watch("size", app.functions.onViewSizeChange);
            // Panels - Show/hide the panel when popup is docked
            this.rawMapView.popup.watch(["visible", "currentDockPosition"], app.functions.setPanelVisibility);
            // Monitor map's movtion
            this.rawMapView.watch("center", function(nc){
                if(nc)
                {
                    console.log(
                        "current mapview, scale:" + app.patientView.rawMapView.scale +
                        ", zoom: " + app.patientView.rawMapView.zoom
                    );
                    //console.log("map center move to lon: " + nc.longitude + ", lat: "+ nc.latitude);
                    var lc = app.patientView.last_center;
                    var distance = 30; //
                    var coord_dist = distance / 111.12;

                    if(Math.abs(nc.longitude - lc.longitude) > coord_dist ||
                        Math.abs(nc.latitude - lc.latitude) > coord_dist)
                    {
                        console.log("move out of range!");
                        app.patientView.last_center = nc;

                        var getUrl = "{0}{1}list_donations?lon={2}&lat={3}&dist={4}".format(
                            [
                                app.request_base_url,
                                app.patientView.request_route,
                                nc.longitude, nc.latitude, distance
                            ]
                        );

                        request.get(getUrl, {}).then(function(data){
                            data = JSON.parse(data);
                            if(data.success && data.data.length){
                                var donations = data.data;
                                app.patientView.donations = donations;
                                var pins = [];
                                for(var i = 0;  i < donations.length; i++)
                                {
                                    var donation = donations[i];
                                    var point = GeoPoint.fromJSON(
                                        {
                                            "x" : donation.donator_geo[0],
                                            "y" : donation.donator_geo[1],
                                            "spatialReference" : {"wkid" : 4326}
                                        }
                                    );
                                    pins.push(point);
                                }
                                app.functions.clearMapPins(app.patientView);
                                app.functions.addPins2PatientView(app.patientView, pins, donations);
                            }else{
                                var a = 1;
                            }
                        }, function(err){}, function(evt){});
                    }
                }
            });

            // Set up socket io
            console.log("connecting to server ... ");
            this.socket = io.connect(app.request_base_url);
            this.socket.on('connect', function () {
                console.log("server connected!!");
            });
            this.socket.on('new_donation_coming', function (data) {
                console.log("Add new coming donation: " + data);
                var donation = data;

                var point = GeoPoint.fromJSON({
                    "x" : donation.donator_geo[0],
                    "y" : donation.donator_geo[1],
                    "spatialReference" : {"wkid" : 4326}
                });

                app.functions.addPins2PatientView(app.patientView, [point], [donation]);
                app.patientView.donations.push(donation);
            });
            this.socket.on('donation_deleted', function(donation_id){
                console.log("Deleting donation id: " + donation_id);
                var dp_idx = null;

                for(var i = 0; i < app.patientView.donations.length; i++)
                {
                    var donation = app.patientView.donations[i];
                    if(donation._id == donation_id)
                    {
                        dp_idx = i;
                        break;
                    }
                }

                if(dp_idx !== null)
                {
                    // Delete pin
                    app.functions.deleteMapPin(app.patientView, app.patientView.pinPoints[dp_idx]);
                }
                app.patientView.donations.splice(dp_idx, 1);
            });
            this.socket.on('donation_update', function (data) {
                console.log("updating donation id: " + data._id);
                var dp_idx = null;

                for(var i = 0; i < app.patientView.donations.length; i++)
                {
                    var donation = app.patientView.donations[i];
                    if(donation._id == data._id)
                    {
                        dp_idx = i;
                        break;
                    }
                }
                if(dp_idx !== null)
                {
                    app.patientView.donations.splice(dp_idx, 1);
                    app.patientView.donations.push(data);
                    //should also update pin point info
                    var pPin = app.patientView.pinPoints[dp_idx];
                    app.functions.deleteMapPin(app.patientView, pPin);

                    var point = GeoPoint.fromJSON({
                        "x" : data.donator_geo[0],
                        "y" : data.donator_geo[1],
                        "spatialReference" : {"wkid" : 4326}
                    });

                    app.functions.addPins2PatientView(app.patientView, [point], [data]);
                }
            });
        }
    };

    return patientView;
});
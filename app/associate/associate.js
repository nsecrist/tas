'use strict';

/* The following require statements are needed for WebPack to work it's magic.
* Each view template must be 'required' or it will be left out of the packed
* min.js file.  It's kind of irritating to have to do this, but I couldn't
* find a better solution.  Can you? */
var mainTemplate = require('./associate.html');
var typeTemplate = require('./type.html');
var scanTemplate = require('./scan.html');
var finishTemplate = require('./finish.html');
var personTemplate = require('./person.html');
var personAddTemplate = require('./person.add.html');

angular.module('myApp.associate', ['ui.router', 'ui.bootstrap'])

// Define states for the wizard (Angular UI Router states)
.config(['$stateProvider', function($stateProvider) {
  $stateProvider.state('associate', {
    abstract: true,
    url: '/',
    template: mainTemplate
  })

  .state('associate.type', {
    template: typeTemplate,
    controller: 'AssociateCtrl'
  })

  .state('associate.person', {
    template: personTemplate,
    controller: 'AssociateCtrl'
  })

  .state('associate.scan', {
    template: scanTemplate,
    controller: 'AssociateCtrl'
  })

  .state('associate.finish', {
    template: finishTemplate,
    controller: 'AssociateCtrl'
  });
}])

// Service for exchanging data with tag association REST API backend
.factory('SubscribeService', ['$http', '$log', function($http, $log) {
  var service = {};
  service.association = { };

  service.error = '';

  service.macaddress = '';

  service.personType = '';

  service.personTypes = ['Jacobs Employee', 'Subcontractor', 'Visitor', 'Client'];

  service.selectedPerson = { };

  // Hard-coded personnel for development without REST API backend running
  // TOOD: Remove this temporary hard-coded data
  service.personnel = [
    {
      "JCE_PID": 1,
      "PersonnelRole": "Craft",
      "FirstName": "Franklin",
      "MiddleName": "Delano",
      "LastName": "Roosevelt",
      "HireDate": "2013-09-05T00:00:00",
      "LocalJacobsBadgeID": "1111",
      "CRCode_FunctionCode": "YYYY",
      "EmployeeNumber": "01234567",
      "OraclePartyID": "1234567",
      "HRJobTitle": "CARPENTER 03",
      "Department": "0000 GENERAL",
      "Shift": "1",
      "Skill": "CARPENTER",
      "Class": "CRAFT FOREMAN",
      "CrewCode": "ASDF",
      "Status": "Y",
      "JacobsStartDate": "2017-05-04T00:00:00",
      "LocationStartDate": "2013-09-05T00:00:00",
      "DateLastChange": "2017-08-01T00:00:00",
      "Company": "Jacobs"
    },
    {
      "JCE_PID": 3,
      "PersonnelRole": "Staff",
      "FirstName": "John",
      "MiddleName": "Fitzgerald",
      "LastName": "Kennedy",
      "HireDate": "2007-10-04T00:00:00",
      "CRCode_FunctionCode": "1234",
      "EmployeeNumber": "0987654321",
      "OraclePartyID": "987654321",
      "HRJobTitle": "CLERK 06",
      "Department": "0000 GENERAL",
      "JacobsStartDate": "2014-11-24T00:00:00",
      "Company": "Jacobs"
    },
    {
      "JCE_PID": 2,
      "PersonnelRole": "Craft",
      "FirstName": "John",
      "MiddleName": "H.",
      "LastName": "Doe",
      "HireDate": "2013-09-05T00:00:00",
      "LocalJacobsBadgeID": "1111",
      "CRCode_FunctionCode": "YYYY",
      "EmployeeNumber": "01234567",
      "OraclePartyID": "1234567",
      "HRJobTitle": "CARPENTER 03",
      "Department": "0000 GENERAL",
      "Shift": "1",
      "Skill": "CARPENTER",
      "Class": "CRAFT FOREMAN",
      "CrewCode": "ASDF",
      "Status": "Y",
      "JacobsStartDate": "2017-05-04T00:00:00",
      "LocationStartDate": "2013-09-05T00:00:00",
      "DateLastChange": "2017-08-01T00:00:00",
      "Company": "INEOS"
    },
    {
      "JCE_PID": 4,
      "PersonnelRole": "Staff",
      "FirstName": "Jane",
      "MiddleName": "T.",
      "LastName": "Doe",
      "HireDate": "2007-10-04T00:00:00",
      "CRCode_FunctionCode": "1234",
      "EmployeeNumber": "0987654321",
      "OraclePartyID": "987654321",
      "HRJobTitle": "CLERK 06",
      "Department": "0000 GENERAL",
      "JacobsStartDate": "2014-11-24T00:00:00",
      "Company": "INEOS"
    },
    {
      "JCE_PID": 5,
      "FirstName": "Bob",
      "LastName": "Loblaw",
      "Company": "Bob Loblaw's Law Blog"
    },
    {
      "JCE_PID": 6,
      "FirstName": "Rob",
      "LastName": "Loblaw",
      "Company": "Bob Loblaw's Law Blog"
    },
    {
      "JCE_PID": 7,
      "FirstName": "JoJo",
      "LastName": "Josephson",
      "Company": "JoJo's Jigs"
    },
    {
      "JCE_PID": 8,
      "FirstName": "Elon",
      "LastName": "Musk",
      "Company": "SpaceX"
    }
  ];

  // Sends a POST request to add the specified person to the database
  service.addPerson = function(person, successCallback, errorCallback) {
    var url = '/tads/api/v1/';

    // TODO: Convert personType to one of the folloiwng: Client, Craft, Staff, Sub, Visitor

    // Get the appropriate endpoint.  Jacobs personnel can not be added
    switch (service.personType) {
      case "Client":
        url += 'client';
        break;

      case "Visitor":
        url += 'visitor';
        break;

      case "Subcontractor":
        url += 'subcontractor';
        break;

      default:
        errorCallback("Unable to add personnel of type '" + service.personType + "'.");
    }

    $http.post(url, person, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(
      // Success callback
      function(response) {
        successCallback(response);
      },
      // Error callback
      function(response){
        errorCallback("An error occurred while submitting new personnel.  " +
        "HTTP Error " + response.status + " - " + response.statusText);
      }
    )
  };

  // Initializes the personnel list by querying the TAS web service
  service.getPersonnel = function() {
    // TODO: Add HTML to show error and to prevent frontend from accepting user input if personnel aren't retrieved

    $http.get('/tads/api/v1/Personnel').then(
      // Success callback
      function(response) {
        $log.debug('Successfully retrieved personnel.');
        service.personnel = response.data;
      },
      // Error callback
      function (response) {
        service.error = 'Failed to get personnel!';
        $log.error('Failed to retrieved personnel!');
      });
    };

    // Sends a POST to the web service to create a new tag association
    service.submitAssociation = function(successCallback, errorCallback) {
      var response = null;

      service.association.jce_pid = service.selectedPerson.JCE_PID;
      service.association.mac_address = service.macaddress;

      $http.post('/tads/api/v1/Associate', service.association, {
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(
        function(response) {
          successCallback(response);
        },
        function (response) {
          errorCallback(response);
        });
        //$http.post('/someUrl', service.association, config).then(successCallback, errorCallback);
      };

      // Initialize the personnel list.
      service.getPersonnel();

      return service;
    }])

    // Controller for the tag association wizard
    .controller('AssociateCtrl', ['$scope', '$state', 'SubscribeService', '$log', '$uibModal', function($scope, $state, SubscribeService, $log, $uibModal) {
      // Get data persisted through the association service
      $scope.association = SubscribeService.association;
      $scope.types = SubscribeService.personTypes;
      $scope.personnel = SubscribeService.personnel;
      $scope.personType = SubscribeService.personType;
      $scope.selectedPerson = SubscribeService.selectedPerson;
      $scope.macaddress = SubscribeService.macaddress;

      // Initialize an error string to an empty string
      $scope.submitError = '';

      // Variables used for validation before copying to service state
      $scope.visitor = { name: '' };
      $scope.subcontractor = { name: '', company: '' };

      // Concatenates a person's name.  Helper function for the finish state
      $scope.getFullNameString = function(person)  {
        var fullName = person.LastName + ", " + person.FirstName;

        if (person.MiddleName != '')
        fullName = fullName + ' ' + person.MiddleName;

        return fullName;
      };

      // Handles moving to the next state in the wizard
      $scope.next = function() {
        if ($state.includes('associate.type')) {
          SubscribeService.personType = $scope.personType;
          $state.go('associate.person');
        }

        else if ($state.includes("associate.person")) {
          SubscribeService.selectedPerson = $scope.person;

          $state.go('associate.scan');
        }

        else if ($state.includes("associate.scan")) {
          SubscribeService.macaddress = $scope.macaddress;
          $state.go('associate.finish');
        }
      };

      // Handles moving to the previous state in the wizard
      $scope.previous = function() {
        if ($state.includes("associate.person")) {
          $state.go('associate.type');
        }

        else if ($state.includes("associate.scan")) {
          $state.go('associate.person');
        }

        else if ($state.includes("associate.finish")) {
          $state.go('associate.scan');
        }
      };

      /* Launches a modal window controlled by AddPersonCtrl and updates the
      personnel list if a new person is added */
      $scope.addPerson = function() {
        // Open a modal dialog for adding personnel
        var modalInstance = $uibModal.open({
          animation: true,    // make the modal pretty
          backdrop: 'static', // prevent backdrop clicks from closing modal
          controller: 'AddPersonCtrl',
          template: personAddTemplate // template comes from a 'require'
        });

        // Wait for the modal dialog's result
        modalInstance.result.then(
          // OK callback
          function () {
            // Update the personnel to get the new person's JCE_PID
            SubscribeService.getPersonnel();

            // Update the list of personnel
            $scope.personnel = SubscribeService.personnel;

            $log.info('New person added.');
          },

          // Cancel callback
          function () {
            $log.debug('Modal dismissed at: ' + new Date());
          });
        };

        // Submits an association, completing the process
        $scope.submit = function() {
          SubscribeService.submitAssociation(
            // Success callback
            function(response) {
              // TODO: Add some kind of notification.  Maybe the index page needs an alert div?
              $log.debug('HTTP response: ' + response.status);

              // Go back to the welcome state
              $state.go('welcome');
            },

            function(response) { // Error callback
              // Log and display an error message
              $log.error("Tag association failed.  HTTP error " + response.status + " - " + response.statusText);
              $scope.submitError = "An error occurred while associating this tag: " + response.status + " - " + response.statusText;
              $scope.response = response;
            }
          );
        };
      }])

      // Controller for the Add Person modal used to add new Visitors, Clients, and Subcontractors
      .controller('AddPersonCtrl', ['$scope', '$uibModalInstance', 'SubscribeService', '$log', function($scope, $uibModalInstance, SubscribeService, $log) {
        $scope.person = { };
        $scope.personType = SubscribeService.personType;

        // Handles a click on the OK button. Validation done in the view
        $scope.ok = function () {
          $log.debug('Add person dialog: User clicked OK.');

          // Add the new person
          SubscribeService.addPerson($scope.person,
            // Success callback
            function(response) {
              // TODO: response contains the new person??, so set selectd person

              // Close the modal
              $uibModalInstance.close();
            },

            // Error callback
            function(response) {
              // TODO: Show an error.  Response contains an error message
            }
          )
        };

        // Handles a click on the Cancel button
        $scope.cancel = function () {
          $log.debug('Add person dialog: User clicked Cancel.');
          $uibModalInstance.dismiss('cancel');
        };
      }]);

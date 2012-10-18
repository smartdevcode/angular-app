// Based loosely around work by Witold Szczerba - https://github.com/witoldsz/angular-http-auth
angular.module('services.authentication', ['services.authentication.current-user', 'services.authentication.interceptor', 'services.authentication.retry-queue']);

// The AuthenticationService is the public API for this module.  Application developers should only need to use this service and not any of the others here.
angular.module('services.authentication').factory('AuthenticationService', ['$http', '$location', '$q', 'AuthenticationRetryQueue', 'currentUser', function($http, $location, $q, queue, currentUser) {

  // TODO: We need a way to refresh the page to clear any data that has been loaded when the user logs out
  //  a simple way would be to redirect to the root of the application but this feels a bit inflexible.
  function redirect(url) {
    url = url || '/';
    $location.path(url);
  }

  function updateCurrentUser(user) {
    currentUser.update(user);
    if ( !!user ) {
      queue.retry();
    }
  }

  var service = {
    isLoginRequired: function() {
      return queue.hasMore();
    },

    showLogin: function() {
      // Push a no-op onto the queue to create a manual login
      queue.push({ retry: function() {}, cancel: function() {} });
    },

    login: function(email, password) {
      var request = $http.post('/login', {email: email, password: password});
      return request.then(function(response) {
        updateCurrentUser(response.data.user);
        return currentUser.isAuthenticated();
      });
    },

    cancelLogin: function(redirectTo) {
      queue.cancel();
      redirect(redirectTo);
    },

    logout: function(redirectTo) {
      $http.post('/logout').then(function() {
        currentUser.clear();
        redirect(redirectTo);
      });
    },

    // Ask the backend to see if a users is already authenticated - this may be from a previous session.
    // The app should probably do this at start up
    requestCurrentUser: function() {
      return $http.get('/current-user').then(function(response) {
        updateCurrentUser(response.data.user);
        return response;
      });
    },

    requireAuthenticatedUser: function() {
      var promise;
      if ( currentUser.isAuthenticated() ) {
        // if we are authenticated already then simply resolve!
        promise = $q.when(currentUser);
      } else {
        promise = queue.pushPromiseFn(service.requireAuthenticatedUser);
      }
      return promise;
    },

    requireAdminUser: function() {
      var promise;
      if ( currentUser.isAdmin() ) {
        // if we are admin already then simply resolve!
        promise = $q.when(currentUser);
      } else {
        promise = queue.pushPromiseFn(service.requireAdminUser);
      }
      return promise;
    }
  };

  // Get the current user when the service is instantiated
  service.requestCurrentUser();

  return service;
}]);

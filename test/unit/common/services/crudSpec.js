describe('CRUD scope mix-ins', function () {

  var $rootScope;

  describe('crud edit methods', function () {

    var crudEditMethods;
    beforeEach(module('services.crud'));
    beforeEach(inject(function (_$rootScope_, _crudEditMethods_) {
      $rootScope = _$rootScope_;
      crudEditMethods = _crudEditMethods_;
    }));

    describe('scope init', function () {
      it('should initialize a scope with an item', function () {
        var item = {key:'value'};
        var scopeMixIn = crudEditMethods('item', item, 'form', angular.noop);
        expect(scopeMixIn.item).toEqual(item);
      });
    });

    describe('scope manipulation', function () {

      var item, scope;
      var successcb = jasmine.createSpy();
      var errorcb = jasmine.createSpy();

      beforeEach(inject(function ($rootScope) {
        item = {key:'value'};
        scope = $rootScope;
        angular.extend(scope, crudEditMethods('item', item, 'form', successcb, errorcb));
      }));

      describe('copy and revert changes', function () {
        it('should correctly detect when revert is possible', function () {
          expect(scope.canRevert()).toBeFalsy();
          scope.item.key = 'changed';
          expect(scope.canRevert()).toBeTruthy();
        });
        it('should make it possible to revert changes', function () {
          scope.item.key = 'changed';
          expect(scope.item).toEqual({key:'changed'});
          scope.revertChanges();
          expect(scope.item).toEqual({key:'value'});
        });
        it('should not revert anything if there were no changes', function () {
          scope.revertChanges();
          expect(scope.item).toEqual({key:'value'});
        });
      });

      describe('save and update', function () {
        it('should not be possible to save if there were no changes', function () {
          scope.form = { $valid : true};
          expect(scope.canSave()).toBeFalsy();
        });
        it('should not be possible to save if a form is invalid', function () {
          scope.form = { $valid : false};
          scope.item = {key : 'changed'};
          expect(scope.canSave()).toBeFalsy();
        });
        it('should be possible to save only if there were changes and a form is valid', function () {
          scope.form = { $valid : true};
          scope.item = {key : 'changed'};
          expect(scope.canSave()).toBeTruthy();
        });
        it('should invoke the $saveOrUpdate method on an item with callback arguments on save', function () {
          item.$saveOrUpdate = jasmine.createSpy();
          scope.save();
          expect(item.$saveOrUpdate).toHaveBeenCalledWith(successcb, successcb, errorcb, errorcb);
        });
      });

      describe('remove', function () {

        it('can remove only if $id is defined', function () {
          item.$id = function () {
            return undefined;
          };
          expect(scope.canRemove()).toBeFalsy();

          item.$id = function () {
            return 'id';
          };
          expect(scope.canRemove()).toBeTruthy();
        });

        it('should simply call success callback if $id not defined', function () {
          item.$id = function () {
            return undefined;
          };
          scope.remove();
          expect(successcb).toHaveBeenCalled();
        });

        it('should call $remove method if $id defined', function () {
          item.$id = function () {
            return 'id';
          };
          item.$remove = jasmine.createSpy();
          scope.remove();
          expect(item.$remove).toHaveBeenCalledWith(successcb, errorcb);
        });
      });
    });
  });

  describe('crud list methods', function () {

    var LocationMock = function() {
      this.pathStr = '';
      this.path = function(path){
        return path ? this.pathStr = path : this.pathStr;
      };
    };

    var $location, crudListMethods;

    beforeEach(function () {
      angular.module('test', ['services.crud']).value('$location', $location = new LocationMock());
    });
    beforeEach(module('test'));
    beforeEach(inject(function (_$rootScope_, _crudListMethods_) {
      $rootScope = _$rootScope_;
      crudListMethods = _crudListMethods_;
    }));

    it('should support new method', function () {
      angular.extend($rootScope, crudListMethods('/prefix'));
      $rootScope['new']();
      expect($location.path()).toEqual('/prefix/new');
    });

    it('should support edit method', function () {
      angular.extend($rootScope, crudListMethods('/prefix'));
      $rootScope.edit('someId');
      expect($location.path()).toEqual('/prefix/someId');
    });
  });
});
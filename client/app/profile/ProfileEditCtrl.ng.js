angular.module('angular-meteor-skeleton').controller('ProfileEditCtrl', function ($rootScope, $scope, $meteor, $timeout, CollectionService, SecurityService, SessionService, MapService, AnimToasterNotificationService) {

    console.log('ProfileEditCtrl');

    $scope.profileState = 'info';
    $scope.setProfileState = function(profileState){
        $scope.profileState = profileState;
    };

    CollectionService.subscribe('my-profile').then(function(profiles){
        $scope.profile = $meteor.object(Profiles, profiles[0] ? profiles[0]._id : null, false) ;
        CollectionService.subscribe('my-profile-images').then(function(images){
            $scope.images = images;
        });
    });

    /*********************/
    /*      Info         */
    /*********************/
    $scope.saveProfile = function(){
        $scope.error = null;
        $meteor.call('save_profile', $scope.profile.getRawObject()).then(function(){
            AnimToasterNotificationService.addSuccessMessage("Profile enregistré avec succès !");
        },function(err){
            AnimToasterNotificationService.addErrorMessage(err.reason);
        });
    };



    /*********************/
    /*      Camera       */
    /*********************/
    var MAX_IMAGES = 3;
    $scope.images = [];

    $scope.addImages = function (files) {
        if (files.length > 0) {
            var reader = new FileReader();
            reader.onload = function (e) {
                $scope.$apply(function () {
                    setPicture(e.target.result);
                });
            };
            reader.readAsDataURL(files[0]);
        } else {
            setPicture(undefined);
        }
    };

    $scope.saveCroppedImage = function () {
        if ($scope.myCroppedImage !== '' && $scope.addable()) {
            var fsFile = new FS.File($scope.myCroppedImage);
            fsFile.owner = SessionService.getOwner();
            fsFile.favorite = $scope.images.length==0 ? true : false;
            if($scope.images.length==0){
                SessionService.setUserProfileImage(fsFile);
            }
            $scope.images.save(fsFile).then(function (image) {
                setPicture(undefined);
            }, function(err){
                AnimToasterNotificationService.addErrorMessage(err.reason);
            });
        }
    };

    $scope.remove = function(img){
        var favorite = img.favorite;
        setTimeout(function(){ // Fix for anim-sidebar click
            $scope.images.remove(img).then(function(){
                if(favorite && $scope.images.length>0){
                    $scope.images[0].update({$set: {'favorite': true}});
                    $timeout(function(){
                        SessionService.setUserProfileImage($scope.images[0]);
                    },100);
                    SessionService.setUserProfileImage($scope.images[0]);
                } else if ($scope.images.length==0) {
                    SessionService.resetImage();
                }
            });
        },100);
    };

    $scope.camera = function(){
        $meteor.getPicture().then(function(data){setPicture(data);});
    };

    $scope.setFavorite = function(img){
        angular.forEach($scope.images, function(image){
            if(image._id == img._id){
                image.update({$set: {'favorite': true}});
                SessionService.setUserProfileImage(image);
            } else {
                image.update({$set: {'favorite': false}});
            }
        });
    };

    var setPicture = function(img){
        $scope.imgSrc = img;
        $scope.myCroppedImage = '';
    };

    $scope.addable = function(){
        return $scope.images.length < MAX_IMAGES;
    };

    /*********************/
    /*      Config       */
    /*********************/
    $scope.isSelected = function(mapStyle){
        return mapStyle == MapService.getCurrentMapStyle() ? '-selected' : '';
    };

    $scope.getAnimClickIcon = function(mapStyle){
        return mapStyle == MapService.getCurrentMapStyle() ? 'fa-dot-circle-o' : 'fa-circle-o';
    };

    $scope.mapStyles = MapService.getMapStyles().mapStyles;
    $scope.setMapStyle = function(mapStyle){
        $meteor.call('save_profile_config', mapStyle).then(function(){
            MapService.setCurrentMapStyle(mapStyle);
            AnimToasterNotificationService.addSuccessMessage("Vos préférences ont été enregistré avec succès !");
        },function(err){AnimToasterNotificationService.addErrorMessage(err.reason);});
    };

    /*********************/
    /*    Security       */
    /*********************/
    $scope.security = {};
    $scope.changePassword = function(){
        if($scope.security.newPassword== $scope.security.newPasswordDiff){
            SecurityService.changePassword($scope.security.oldPassword, $scope.security.newPassword).then(function () {
                $scope.error =null;
                AnimToasterNotificationService.addSuccessMessage("Mot de passe modifié avec succès !");
            }, function(err){AnimToasterNotificationService.addWarningMessage(err.reason);});
        } else {
            $scope.error={reason:'Les 2 nouveaux mots de passe ne correspondent pas.'};
        }

   };

});




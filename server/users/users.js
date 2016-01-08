var admin_mail = 'angular-meteor-skeleton@gmail.com'

Meteor.startup(function () {
    if(Meteor.users.find({'emails.address':admin_mail}).count()<=0){
        Accounts.createUser({
            email: admin_mail,
            username: "admin",
            password: "caca",
            profile: { roles:["admin"] },
            roles: ["admin"]
        });
    }
});

// TODO: Make more agressive test
// Options : trusted data (from Meteor, third libraries... ) | user : untrusted data (from front)
Accounts.onCreateUser(function(options, user) {
    if(options.email==admin_mail){
        user.profile = options.profile = { roles:["admin"] };
        user.roles = options.roles = ["admin"];
    } else {
        user.profile = options.profile = { roles:["helper"] };
        user.roles = options.roles = ["helper"]
    }
    return user;
});


Meteor.users.deny({
    update: function (userId, doc, fields, modifier) {
        return !isAdmin(this.userId);
    }
});

Meteor.publish("all-users", function(){
    if(isAdmin(this.userId)){
        return Meteor.users.find({'_id': { $ne: this.userId }});
    } else {
        this.stop();
        return;
    }
});

Meteor.methods({
    check_user: function(username, digest){
        var user = Meteor.users.findOne({'$or': [{'username': username},{'emails.address': username}]});
        if(user){
            var password = {digest: digest, algorithm: 'sha-256'};
            var result = Accounts._checkPassword(user, password);
            if(result.error==null){
                return true;
            }
        }
        throw new Meteor.Error(404, 'User not found');
    },
    init_user_profile: function(departmentCode){
        var user = Meteor.users.findOne({'_id': this.userId});
        if(user){
            var email = user.emails[0] ? user.emails[0].address : '';
            if(!Profiles.findOne({'owner.id': this.userId})){
                var department = Departments.findOne({code:departmentCode});
                return Profiles.insert({
                    owner: {id:this.userId},
                    active: true,
                    email: email,
                    userName: email.split('@')[0].capitalize(),
                    mapStyle: 'skeletonStyle2',
                    department:department,
                    createdAt: Date.now()
                });
            } else {
                throw new Meteor.Error(403, 'Profile already exists');
            }
        } else {
            throw new Meteor.Error(404, 'User not found');
        }
    },
    delete_user: function (userId) {
        if(isAdmin(this.userId) && userId != this.userId){
            Events.remove({'owner.id':userId});
            return Meteor.users.remove(userId);
        }
        throw new Meteor.Error(401, 'Error 401: Not allowed - You can not delete this user');
    }
});

isAdmin = function(userId){
    var isAdmin = false;
    var user = Meteor.users.findOne({'_id':userId});
    if(user && user.profile && user.profile.roles && user.profile.roles.length>0){
        for(var i=0; i< user.profile.roles.length; i++){
            if(user.profile.roles[i]==="admin"){
                isAdmin = true;
                break;
            }
        }
    }
    return isAdmin;
};

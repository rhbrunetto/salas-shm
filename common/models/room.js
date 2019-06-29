'use strict';

module.exports = function(Room) {

    const MAX_PLAYERS_PER_ROOM = 2;

    const STATUS_FINISHED = 'FINISHED';
    const STATUS_PLAYING = 'PLAYING';
    const STATUS_WAITING = 'WAITING FOR PLAYERS';

    function buildError(message, status){
        var err = new Error(message);
        err.status = status;
        return err;
    }

    function checkInvite(room, invite){
        return room.invites.findOne({ where: { token: invite.token }}).
        then((inviteFound) => {
            if (inviteFound == null)
                throw buildError("Invite not found", 404);
            if (inviteFound.used == true)
                throw buildError("Invite has been used", 403);
            inviteFound.used = true;
            return inviteFound.save();
        }).then((_) => room);
    }

    function hasJoined(room){
        room.players += 1;
        if (room.players == MAX_PLAYERS_PER_ROOM)
            room.status = STATUS_PLAYING;
        return room.save();
    }

    function hasLeft(room){
        room.players -= 1;
        room.status = STATUS_WAITING;
        return room.save();
    }

    Room.join = (id, body, cb) => {
        Room.findById(id).then((room) => {
            if (room == null)
                throw buildError("Room not found", 404);
            if (room.players == MAX_PLAYERS_PER_ROOM)
                throw buildError("Room is full", 403);
            if (room.status == STATUS_FINISHED)
                throw buildError("Room's game is over", 403);
            return room;
        }).then((room) => {
            console.log(body)
            if (room.password == null)
                return room;
            if (body.password != null && body.password == room.password)
                return room;
            if (body.token != null)
                return checkInvite(room, body);
            throw buildError("Not authenticated", 401)
        }).then((room) => hasJoined(room))
        .then((room) => cb(null, room))
        .catch((err) => cb(err));
    }

    Room.remoteMethod('join',
        {
            accepts: [
                {
                    arg: 'id',
                    type: 'number',
                    required: true
                },
                {
                    arg: 'body',
                    type: 'Object',
                    required: false,
                    http: {
                        source: 'body'
                    }
                }
            ],
            returns: {
                type: 'Room',
                root: true
            },
            http: {
                path: '/:id/join',
                verb: 'post'
            }
        });
    

    Room.auto = (parameters, cb) => {
        if (parameters.n == undefined)
            parameters.n = 4
        parameters.players = 1
        parameters.status = STATUS_WAITING;
        parameters.password = null;
        
        console.log(parameters);
        Room.findOrCreate(parameters).then((obj) => {
            const room = obj[0]
            const newInstance = obj[1]
            if (newInstance)
                return room;
            return hasJoined(room);
        })
        .then((room) => cb(null, room))
        .catch((err) => cb(err));
    };

    Room.remoteMethod('auto',
        {
            accepts: [
                {
                    arg: 'parameters',
                    type: 'Object',
                    required: false,
                    http: {
                        source: 'body'
                    }
                }
            ],
            returns: {
                type: 'Room',
                root: true
            },
            http: {
                path: '/auto',
                verb: 'post'
            }
        });


    Room.changeStatus = (id, status, cb) => {
        Room.findById(id).then((room) => {
            if (room == null)    
                throw buildError("Room not found", 404);
            return room;
        })
        .then((room) => {
            if (status.status != STATUS_WAITING &&
                status.status != STATUS_PLAYING &&
                status.status != STATUS_FINISHED)
                throw buildError("Invalid Status", 400);
            room.status = status.status;
            return room.save();
        })
        .then((room) => cb(null, room))
        .catch((err) => cb(err));
    };

    Room.remoteMethod('changeStatus',
        {
            accepts: [
                {
                    arg: 'id',
                    type: 'number',
                    required: true
                },
                {
                    arg: 'status',
                    type: 'Object',
                    required: false,
                    http: {
                        source: 'body'
                    }
                }
            ],
            returns: {
                type: 'Room',
                root: true
            },
            http: {
                path: '/:id/changeStatus',
                verb: 'post'
            }
        });


    Room.leave = (id, cb) => {
        Room.findById(id).then((room) => {
            if (room == null)    
                throw buildError("Room not found", 404);
            return room;
        })
        .then((room) => hasLeft(room))
        .then((room) => cb(null, room))
        .catch((err) => cb(err));
    };

    Room.remoteMethod('leave',
        {
            accepts: [
                {
                    arg: 'id',
                    type: 'number',
                    required: true
                }
            ],
            returns: {
                type: 'Room',
                root: true
            },
            http: {
                path: '/:id/leave',
                verb: 'post'
            }
        });

    Room.makeInvite = (id, cb) => {
        Room.findById(id).then((room) => {
            if (room == null)    
                throw buildError("Room not found", 404);
            return room;
        })
        .then((room) => room.invites.create({}))
        .then((invite) => cb(null, invite))
        .catch((err) => cb(err));
    };

    Room.remoteMethod('makeInvite',
        {
            accepts: [
                {
                    arg: 'id',
                    type: 'number',
                    required: true
                }
            ],
            returns: {
                type: 'Invite',
                root: true
            },
            http: {
                path: '/:id/makeInvite',
                verb: 'post'
            }
        });

};

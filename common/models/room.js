'use strict';

module.exports = function(Room) {

    const MAX_PLAYERS_PER_ROOM = 2;

    function buildError(message, status){
        var err = new Error(message);
        err.status = status;
        return err;
    }

    function checkInvite(room, invite){
        return room.invites.findOne({ where: { token: invite.token }}).
        then((inviteFound) => {
            if (inviteFound == null)
                throw buildError("Invite not found", 404)
            if (inviteFound.used == true)
                throw buildError("Invite has been used", 403)
            inviteFound.used = true;
            return inviteFound.save();
        })
        .then((_) => room)
    }

    Room.join = (id, invite, password, cb) => {
        Room.findById(id).then((room) => {
            if (room == null)
                throw buildError("Room not found", 404)
            if (room.players == MAX_PLAYERS_PER_ROOM)
                throw buildError("Room is full", 403)
            if (room.status == 'FINISHED')
                throw buildError("Room's game is over", 403)
            return room;
        }).then((room) => {
            console.log(invite)
            console.log(password)
            if (room.password == null)
                return room
            if (password != null && password.password == room.password)
                return room;
            if (invite != null)
                return checkInvite(room, invite);
            throw buildError("Not authenticated", 401)
        })
        .then((room) => {console.log(room); cb(null, room)})
        .catch((err) => cb(err))
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
                    arg: 'invite',
                    type: 'Invite',
                    required: false,
                    http: {
                        source: 'body'
                    }
                },
                {
                    arg: 'password',
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
};

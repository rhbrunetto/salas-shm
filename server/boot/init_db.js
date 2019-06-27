module.exports = function (app) {
    var ds = app.dataSources.db

    // ds.automigrate(function () {
    //   ds.discoverModelProperties('*', function (err, props) {
    //   })
    // })

    ds.autoupdate(function () {
        ds.discoverModelProperties('*', function (err, props) {
            console.log(props)
        })
        const config = require('../../server/config.json')
        // if (config.release) return;

        var Room = app.models.Room
        var Invite = app.models.Invite
        
        var rooms = require('../../data/rooms.json')
        var invites = require('../../data/invites.json')

        Room.create(rooms, (err, room) => {
            if (err && !config.release) {
                console.log(err)
            }
        })

        Invite.create(invites, (err, invite) => {
            if (err && !config.release) {
                console.log(err)
            }
        })

        // Usuario.create(usuario, (err, configuration) => {
        //     if (config.release) return;
        //     if (err && !config.release) {
        //         console.error(err)
        //     } else {
        //         Usuario.login(usuario[0], (err, token) => {
        //             console.log(token)
        //         })
        //     }
        // })
    })
}

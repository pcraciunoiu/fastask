/**
 * Handles data transfer, offline storage, syncing.
 * Expects a global variable FASTASK.
 * @requires jQuery (tested with 1.4.[012])
 * @requires constants.js
 */
function Data() {
    FASTASK.data = this;
    // each of these is keyed by the user/anonuser id
    this.tasks = null;
    this.folders = null;
    this.friends = null;
    this.current_key = null;  // current key for all of the above
    this.storage = window.localStorage;

    this.get_current_key = function () {
        if (FASTASK.constants.current_user.is_authenticated) {
            this.current_key = FASTASK.constants.current_user.id;
        } else {
            // TODO: current key for anonymous users
        }
    }

    /**
     * Gets data stored at key
     * @param string key
     */
    this._get_data = function (key) {
        var str_data = this.storage.getItem(this.current_key + '_' + key);
        return JSON.parse(str_data);
    }

    /**
     * Sets data at key.
     * @param string key
     * @param object data, stringified by JSON.stringify
     */
    this._set_data = function (key, data) {
        var str_data = JSON.stringify(data);
        this.storage.setItem(this.current_key + '_' + key, str_data);
    }

    /**
     * Gets the list of tasks from local storage.
     */
    this.get_tasks = function () {
        this.tasks = this._get_data('tasks');
        return this.tasks;
    }

    /**
     * Gets the list of folders from local storage.
     */
    this.get_folders = function () {
        this.folders = this._get_data('folders');
        return this.folders;
    }

    /**
     * Gets the list of friends from local storage.
     */
    this.get_friends = function () {
        this.friends = this._get_data('friends');
        return this.friends;
    }

    this.is_online = function () {
        if (navigator && navigator.onLine !== undefined) {
            return navigator.onLine;
        }
        try {
            var request = new XMLHttpRequest();
            request.open('GET', '/', false);
            request.send(null);
            return (request.status === 200);
        }
        catch(e) {
            return false;
        }
    }

    /**
     * Syncs data between local storage and server, depending on
     * modifications and online status.
     */
    this.sync_data = function () {
        // must be online to sync
        if (!this.is_online()) {
            return false;
        }

        // is there any modified data in local storage?
        var last_sync = this._get_data('last_sync');

        // have we never synced before in this browser?
        if (!last_sync) {
            // TODO: first-time sync
            last_sync = {};
            last_sync.when = new Date().getTime();
            last_sync.is_modified = false;
        }

        if (last_sync.is_modified) {
            // TODO: sync modified data
            // load new data on callback afterwards
            return false;
        }
        // data is synced, update sync time
        this._set_data('last_sync', last_sync);

        $.ajax({
            type: 'POST',
            url: FASTASK.constants.paths.all + '?after=' + last_sync.when,
            dataType: 'json',
            data: {'last_sync': last_sync.sync_date},
            beforeSend: function () {
                // TODO: set sync status and show that we're syncing somewhere
            },
            error: function (request, textStatus, error) {
                // store internals for passing around of data
                FASTASK.list_handler.request = request;
                FASTASK.list_handler.textStatus = textStatus;
                FASTASK.list_handler.error = error;
                FASTASK.list_handler.response = null;
                // clear the loading
                for (var i in FASTASK.list_handler.expecting) {
                    if (FASTASK.list_handler.expecting[i]) {
                        FASTASK.list_handler.unset_loading(i);
                    }
                }
                // handle not found
                if (request.status === 404) {
                    // still set the title and active tab
                    if (FASTASK.list_handler.expecting[0]) {
                        $('.title', FASTASK.constants.lists[0])
                            .html(FASTASK.constants.titles_html[FASTASK.list_handler.type]);

                        FASTASK.constants.templates.notasks.insertBefore(
                            $('.table', FASTASK.constants.lists[0]));
                        $('.table', FASTASK.constants.lists[0])
                            .children().remove().end()
                            .html('');
                    }

                    FASTASK.list_handler.update_active_tabs();
                }
            },
            success: function (response, textStatus, request) {
                // store retrieved data
                FASTASK.data.store_new_data(response);
            }
        });
    }

    /**
     * Stores new data received from sync_data()
     * @param JSON response
     */
    this.store_new_data = function(response) {
        this._set_data('tasks', response.tasks);
        this._set_data('folders', response.groups);
    }

    // init stuff
    this.get_current_key();
    this.sync_data();
    this.get_tasks();
    this.get_folders();
    this.get_friends();
}

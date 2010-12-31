/**
 * Handles data transfer, offline storage, syncing.
 * Expects a global variable FASTASK.
 * @requires jQuery (tested with 1.4.[012])
 * @requires constants.js
 */
function Data() {
    FASTASK.data = this;
    this.tasks = null;
    this.folders = null;
    this.friends = null;
    this.storage = window.localStorage;
    // queue of requests, populated if offline
    this.queue = [];
    this.last_sync = null;

    /**
     * Gets data stored at key
     * @param string key
     */
    this._get_data = function (key) {
        var str_data = this.storage.getItem(key);
        return JSON.parse(str_data);
    }

    /**
     * Sets data at key.
     * @param string key
     * @param object data, stringified by JSON.stringify
     */
    this._set_data = function (key, data) {
        var str_data = JSON.stringify(data);
        this.storage.setItem(key, str_data);
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
        this.last_sync = this._get_data('last_sync');

        // have we never synced before in this browser?
        if (!this.last_sync) {
            // TODO: first-time sync
            this.last_sync = {};
            this.last_sync.when = new Date().getTime();
            this.last_sync.is_modified = false;
        }

        if (this.last_sync.is_modified) {
            // TODO: sync modified data
            // load new data on callback afterwards
            while (this.queue.length > 0) {
                var ajaxopts = this.queue.pop();
                $.ajax(ajaxopts);
            }
            this._set_data('queue', []);
            this.last_sync.is_modified = false;
        }
        // data is synced, update sync time
        this._set_data('last_sync', this.last_sync);

        $.ajax({
            type: 'POST',
            url: FASTASK.constants.paths.all + '?after=' + this.last_sync.when,
            dataType: 'json',
            data: {'last_sync': this.last_sync.sync_date},
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
        this._set_data('friends', response.friends);
    }

    /**
     * Process action from a row. See also row_handler.update_row.
     */
    this.process_action = function(task_id, action, data, ajaxopts) {
        var dataopts = {dataType: 'json'},
            request = {status: 200},
            response = {};
        $.extend(dataopts, ajaxopts);

        dataopts.success = function () {};
        dataopts.complete = dataopts.success;
        dataopts.beforeSend = dataopts.success;
        dataopts.error = function () { alert('error') };
        dataopts.data = {};
        dataopts.data[action] = data;

        ajaxopts.beforeSend();
        // update local storage and send ajax request
        this.tasks[task_id][action] = data;
        this._set_data('tasks', this.tasks);

        if (this.is_online()) {
            $.ajax(dataopts);
        } else {
            this.queue.push(dataopts);
            this.last_sync.is_modified = true;
            this._set_data('last_sync', this.last_sync);
            this._set_data('queue', this.queue);
        }

        response[action] = data;
        ajaxopts.complete(request, '');
        ajaxopts.success(response, '', request);
    }

    // TODO: don't add these if browser does not support them
    window.addEventListener('online', function() {
        // sync data when going online
        FASTASK.data.sync_data();
    }, true);
    // init stuff
    this.queue = this._get_data('queue') || [];
}

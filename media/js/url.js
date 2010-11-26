/**
 * Handles URL hash changes, parses and updates the URL accordingly
 * @requires jQuery (tested with 1.3.*, 1.4.[012])
 * @requires jquery.history plugin
 * @requires list.js
 */
function Url() {
    var url_handler = this;
    // store the initial url
    this.INITIAL_URL = window.location.href;

    // and the no-hash version
    this.INITIAL_URL_NOHASH = this.INITIAL_URL.substr(0,
        window.location.href.indexOf('#'));

    // stores last hash when action was taken
    this.hash_last = '';

    this.allow_get_lists = false;

    /**
     * This function is called:
     * 1. after calling $.historyInit();
     * 2. after calling $.historyLoad();
     * 3. after hitting Back button of a browser
     *
     * Takes no action if hash hasn't changed. Otherwise, it updates the lists
     * @param string hash the part of the url after # (and not including)
     */
    this.on_hash_change = function (hash) {
        if (hash === this.hash_last) {
            return false;
        }

        url_handler.hash_last = hash;
        var mainpage = parseInt(url_handler.get_url_param(
                FASTASK.constants.params.mainpage, window.location.href), 10),
            minipage = parseInt(url_handler.get_url_param(
                FASTASK.constants.params.minipage, window.location.href), 10),
            group = parseInt(url_handler.get_url_param(
                FASTASK.constants.params.group, window.location.href), 10),
            type = parseInt(url_handler.get_url_param(
                FASTASK.constants.params.type, window.location.href), 10);

        if (mainpage !== url_handler.mainpage ||
            minipage !== url_handler.minipage ||
            group !== url_handler.group ||
            type !== url_handler.type) {

            // main list changed, reload it
            if (mainpage !== url_handler.mainpage ||
                group !== url_handler.group ||
                type !== url_handler.type) {
                FASTASK.list_handler.expect(0);
            }

            // mini list changed, reload it
            if (minipage !== url_handler.minipage) {
                FASTASK.list_handler.expect(1);
            }

            url_handler.mainpage = mainpage;
            url_handler.minipage = minipage;
            url_handler.group = group;
            url_handler.type = type;
            FASTASK.list_handler.set_params(mainpage, minipage, group, type);
            if (url_handler.allow_get_lists) {
                FASTASK.list_handler.get_lists();
            }
        }
    };

    /**
     * Gets a URL parameter by name from a given URL
     * Only works with the hash
     * Uses constant FASTASK.constants.hash_separator
     * @param string name param to look for
     * @param (optional) string url what to look in, defaults to
     *     window.location.href
     */
    this.get_url_param = function (name, url) {
        if (!url || undefined === url) {
            url = window.location.href;
        }
        // sanitize name
        name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');

        // start searching
        var regexS = '[\\#;]' + name + '=([^' + FASTASK.constants.hash_separator + ']*)',
            regex = new RegExp(regexS),
            results = regex.exec(url);
        if (results === null) {
            // default some parameters
            if (name === FASTASK.constants.params.mainpage ||
                name === FASTASK.constants.params.minipage) {
                return 1;
            }
            if (name === FASTASK.constants.params.group ||
                name === FASTASK.constants.params.type) {
                return 0;
            }

            // else just return empty string
            return '';
        }
        return results[1];
    };

    /**
     * Updates the hash with a param and a value. Optionally resets the page
     * @param string param param name
     * @param string val param value
     * @param bool erase_page reset page number or not
     */
    this.url_update_hash = function (param, val, reset_page) {
        var new_hash = '', initial = this.hash_last,
            params_values = [], params = {}, param_value,
            i;
        // split url into params
        if (initial) {
            params_values = initial.split(';');
            for (i in params_values) {
                param_value = params_values[i].split('=');
                params[param_value[0]] = param_value[1];
            }
        }

        // update value
        params[param] = val;

        // reset page if told to
        if (reset_page && params.p) {
            delete params.p;
        }
        // if type changes, delete group
        if (param === FASTASK.constants.params.type) {
            delete params.g;
        }

        // any of these changes requires page reset
        if ((undefined !== params.g &&
            parseInt(params.g, 10) !== this.group) ||
            (undefined !== params.t &&
            parseInt(params.t, 10) !== this.type)) {
            params.p = 1;
        }

        // done setting up, collapse params to string
        for (i in params) {
            if (!params[i]) {
                continue;
            }
            new_hash += ';' + i + '=' + params[i];
        }
        window.location.href = this.INITIAL_URL_NOHASH +
            '#' + new_hash.substr(1);
    };

    // pages:
    // main list page
    this.mainpage = this.get_url_param(FASTASK.constants.params.mainpage, this.INITIAL_URL);

    // mini list page
    this.minipage = this.get_url_param(FASTASK.constants.params.minipage, this.INITIAL_URL);

    // group number
    this.group = this.get_url_param(FASTASK.constants.params.group, this.INITIAL_URL);

    // main list type
    this.type = this.get_url_param(FASTASK.constants.params.type, this.INITIAL_URL);

    $.historyInit(this.on_hash_change, this.INITIAL_URL);
}
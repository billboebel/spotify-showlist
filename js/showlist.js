;(function($, getSpotifyApi, document){

  "use strict";

  var noop = function(){},
      Showlists = {
        OFFICIAL: 'OFFICIAL',
        UNOFFICIAL: 'UNOFFICIAL',
      },
      SXSW_DAYS = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      Showlist = function(sxsw_year, sxsw_start_day) {
        this.models = getSpotifyApi().require('$api/models');
        this.sxsw_start_day = sxsw_start_day;
        this.sxsw_end_day = this.sxsw_start_day + SXSW_DAYS.length;
        this.sxsw_year = sxsw_year;
        this.artist_names = [];
        this.unofficial_pages = {};
        this.shows = {
          OFFICIAL: {},
          UNOFFICIAL: {}
        };
        this.bindEvents();
      };

  Showlist.prototype = {

    constructor: Showlist,

    bindEvents: function(){

      var that = this;

      $('#filter_shows').bind('click', function(){
        that.renderShows();
      });
      $('body').css('background-color','#fff');

      document.getElementById('drop_box').addEventListener('dragstart', function(e){
          e.dataTransfer.setData('text/html', this.innerHTML);
          e.dataTransfer.effectAllowed = 'copy';
      }, false);

      document.getElementById('drop_box').addEventListener('dragenter', function(e){
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          this.classList.add('over');
      }, false);

      document.getElementById('drop_box').addEventListener('dragover', function(e){
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        return false;
      }, false);

      document.getElementById('drop_box').addEventListener('dragleave', function(e){
        e.preventDefault();
        this.classList.remove('over');
      }, false);

      document.getElementById('drop_box').addEventListener('drop', function(e){        
        e.preventDefault();
        var drop = that.models.Playlist.fromURI(e.dataTransfer.getData('text'));
        this.classList.remove('over');
        var success_message = document.createElement('p');
        success_message.innerHTML = 'Playlist successfully dropped: ' + drop.uri;
        this.appendChild(success_message);
        that.collectArtists(drop.uri);
      }, false);

    },

    collectArtists: function(playlist_url) {
      var that = this;
      this.models.Playlist.fromURI(playlist_url, function(playlist) {
        var artist_name, i, l;
        for (i = 0, l = playlist.tracks.length; i < l; i++){
          artist_name = playlist.tracks[i].artists[0].name;
          if (that.artist_names.indexOf(artist_name) === -1) {
            that.artist_names.push(artist_name);
          }
        }
      });
    },

    drawOfficialShows: function(day) {
      var that = this, timeLocationHelper = function(d){
        return [d.time, d.location].join(" at ");
      };
      $('#output').html('');
      $.each(this.filterOfficialShows(day), function(artist_name, artist_shows){
        var output_str = "<p><a href='" + that.sxswSearchUrl(artist_name) +
          "'>" + artist_name + "</a><br />" +
          artist_shows.map(timeLocationHelper).join("<br />") + "</p><br />";
        $('#output').append(output_str);
      });
    },

    drawUnofficialShows: function(day) {
      $('#output').html('');
      if (this.artist_names.length === 0) return;
      var artist_pattern = new RegExp(this.artist_names.map(function(n){return "\\b" + n + "\\b";}).join('|'), "i");
      $.each(this.shows[Showlists.UNOFFICIAL][day], function(i, show){
        if (show.slice(show.indexOf('<li>'),show.length-1).search(artist_pattern) > -1) {
          $('#output').append('<br />' + show);
        }
      });
      $('#output').highlight(this.artist_names, { wordsOnly: true });
    },

    filterOfficialShows: function(day) {
      var that = this, filtered = {};
      $.each(this.shows[Showlists.OFFICIAL][day], function(i, show) {
        if (that.artist_names.indexOf(show.artist) > -1) {
          if (!filtered[show.artist]) filtered[show.artist] = [];
          filtered[show.artist].push(show);
        }
      });
      return filtered;
    },

    isLoaded: function(showlist, day) {
      return this.shows[showlist] && this.shows[showlist][day] &&
        this.shows[showlist][day].length > 0;
    },

    loadDayOfficial: function(day, fn) {
      var that = this, artist, location, time, notes, nodes, node,
          div_id = 'scraper-official-' + day,
          url = this.officialUrl(day);
      typeof fn !== 'function' && (fn = noop);
      if (!this.shows[Showlists.OFFICIAL]) {
        this.shows[Showlists.OFFICIAL] = {};
      }
      if (this.isLoaded(Showlists.OFFICIAL, day)) {
        return fn();
      }
      this.shows[Showlists.OFFICIAL][day] = [];
      if (typeof url === 'undefined') return fn();
      $('body').append('<div id="' + div_id + '" style="display: none;" />');
      $('#' + div_id).load(url + ' #main', function(){
        nodes = $('#' + div_id +' #main .data')[0].childNodes;
        for (var i = 0; i < nodes.length; i++) {
          if (typeof nodes[i].id === 'undefined' || nodes[i].id.substr(0, 11) !== 'cell_event_') {
            continue;
          }
          node = $(nodes[i])[0];
          artist = $(node.getElementsByClassName('col1'))[0] &&
            $(node.getElementsByClassName('col1'))[0].getElementsByClassName('link_item')[0] &&
            $(node.getElementsByClassName('col1'))[0].getElementsByClassName('link_item')[0].innerText.trim();
          location = $(node.getElementsByClassName('col3'))[0] &&
            $(node.getElementsByClassName('col3'))[0].getElementsByClassName('location')[0] &&
            $(node.getElementsByClassName('col3'))[0].getElementsByClassName('location')[0].innerText.trim() || 'TBA';
          time = $(node.getElementsByClassName('col4'))[0] &&
            $(node.getElementsByClassName('col4'))[0].getElementsByClassName('date_time')[0] &&
            $(node.getElementsByClassName('col4'))[0].getElementsByClassName('date_time')[0].innerText.trim() || 'TBA';
          if (!artist) continue;
          that.shows[Showlists.OFFICIAL][day].push({
            artist: artist,
            location: location,
            time: time
          });
        }
        $('#' + div_id).remove();
        fn();
      });
    },

    loadDayUnofficial: function(day, fn) {
      var day_parts = ['day', 'night'];
      if (!this.shows[Showlists.UNOFFICIAL]) {
        this.shows[Showlists.UNOFFICIAL] = {};
      }
      if (this.isLoaded(Showlists.UNOFFICIAL, day)) {
        return fn();
      }
      this.shows[Showlists.UNOFFICIAL][day] = [];
      this.unofficial_pages[day] = [];
      for (var i = 0; i < day_parts.length; i++) {
        this.loadPageUnofficial(day, day_parts[i], fn);
      }
    },

    loadPageUnofficial: function(day, day_part, fn) {
      var that = this, shows_html, shows,
          url = 'http://showlistaustin.com/sxsw/' + this.sxsw_year + '/' + day.substr(0,3) + day_part + '.shtml',
          div_id = 'scraper-unofficial-' + day.substr(0,3) + day_part;
      fn = fn || noop;
      $('body').append('<div id="' + div_id + '" style="display: none;" />');
      $('#' + div_id).load(url + ' .printcontent', function(){
        shows_html = $('#' + div_id)[0].getElementsByTagName('ul')[0].innerHTML;
        shows = shows_html.split(/<hr style="color:#cccccc;"\s*\/*>/);
        for (var i = 0; i < shows.length; i++) {
          if (!shows[i]) continue;
          that.shows[Showlists.UNOFFICIAL][day].push(shows[i]);
        }
        $('#' + div_id).remove();
        that.unofficial_pages[day].push(url);
        if (that.unofficial_pages[day] && that.unofficial_pages[day].length === 2) {
          fn();
        }
      });
    },

    officialUrl: function(day) {
      var idx = SXSW_DAYS.indexOf(day);
      if (idx === -1) return;
      return 'http://schedule.sxsw.com/?conference=music&day=' + (idx + this.sxsw_start_day);
    },

    renderShows: function() {
      var that = this;
      $('#loading-img').show();
      $("#filter_shows").prop("disabled",true);
      var show_source = $('#show_source').val();
      var show_day = $('#show_day').val();
      if (show_source == 'official') {
        that.loadDayOfficial(show_day, function(){
          that.drawOfficialShows(show_day);
          $('#loading-img').hide();
          $("#filter_shows").prop("disabled",false);
        });
      } else {
        that.loadDayUnofficial(show_day, function(){
          that.drawUnofficialShows(show_day);
          $('#loading-img').hide();
          $("#filter_shows").prop("disabled",false);
        });
      }
    },

    sxswSearchUrl: function(artist_name) {
      return "http://schedule.sxsw.com/search?q=" + encodeURIComponent(artist_name) +
        "&conferences%5B%5D=film&conferences%5B%5D=interactive&conferences%5B%5D=music";
    }

  };

  new Showlist(2015, 17);

})(jQuery, getSpotifyApi, document);

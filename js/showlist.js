"use strict";

/**
 * Global variables (change sxsw_year and sxsw_start_day each year)
 */

var noop = function(){},
    sp = getSpotifyApi(),
    models = sp.require('$api/models'),
    sxsw_start_day = 11,
    sxsw_days = ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    sxsw_end_day = sxsw_start_day + sxsw_days.length,
    sxsw_year = 2014;

window.artist_names = [];
window.official_shows = {};
window.unofficial_shows = {};

/**
 * Filtering/rendering methods
 */

var collectArtists = function(playlist_url) {
  if (!window.artist_names) window.artist_names = [];
  var pl = models.Playlist.fromURI(playlist_url, function(playlist) {
    for (var i = 0, l = playlist.tracks.length; i < l; i++){
      var artist_name = playlist.tracks[i].artists[0].name;
      if ($.inArray(artist_name, artist_names) == -1) {
        window.artist_names.push(artist_name);
      }
    }
  });
};

var draw_official_shows = function(day) {
  var output_str;
  $('#output').html('');
  $.each(filter_official_shows(day), function(artist_name, artist_shows){
    var output_str = "<p><a href='" + sxsw_search_url(artist_name) + "'>" + artist_name + "</a><br />" + 
      artist_shows.map(function(d){return [d.time, d.location].join(" at ")}).join("<br />") + 
      "</p><br />";
    $('#output').append(output_str);
  });
};

var draw_unofficial_shows = function(day) {
  $('#output').html('');
  if (window.artist_names.length === 0) return;
  var artist_pattern = new RegExp(window.artist_names.map(function(n){return "\\b" + n + "\\b";}).join('|'), "i");
  $.each(window.unofficial_shows[day], function(i, show){
    if (show.slice(show.indexOf('<li>'),show.length-1).search(artist_pattern) > -1) {
      $('#output').append('<br />' + show);
    }
  });
  $('#output').highlight(window.artist_names, { wordsOnly: true });
};

var filter_official_shows = function(day) {
  var filtered = {};
  $.each(window.official_shows[day], function(i, show) {
    if (window.artist_names.indexOf(show.artist) > -1) {
      if (!filtered[show.artist]) filtered[show.artist] = [];
      filtered[show.artist].push(show);
    };
  });
  return filtered;
};

var render_shows = function() {
  $('#loading-img').show();
  $("#filter_shows").prop("disabled",true);
  var show_source = $('#show_source').val();
  var show_day = $('#show_day').val();
  if (show_source == 'official') {
    load_day_official(show_day, function(){
      draw_official_shows(show_day);
      $('#loading-img').hide();
      $("#filter_shows").prop("disabled",false);
    });
  } else {
    load_day_unofficial(show_day, function(){
      draw_unofficial_shows(show_day);
      $('#loading-img').hide();
      $("#filter_shows").prop("disabled",false);
    });
  }
};

var sxsw_search_url = function(artist_name) {
  return "http://schedule.sxsw.com/search?q=" + encodeURIComponent(artist_name) +
    "&conferences%5B%5D=film&conferences%5B%5D=interactive&conferences%5B%5D=music";
};

/**
 * Loading/scraping methods
 */

var already_loaded = function(showlist, day) {
  return window[showlist][day] && window[showlist][day].length > 0
};

var load_day_official = function(day, fn) {
  var artist, location, time, notes, nodes, node,
      div_id = 'scraper-official-' + day,
      fn = fn || noop;
  if (!window.official_shows) window.official_shows = {};
  if (already_loaded('official_shows', day)) return fn();
  window.official_shows[day] = [];
  $('body').append('<div id="' + div_id + '" style="display: none;" />');
  $('#' + div_id).load(official_url(day) + ' #main', function(){
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
      window.official_shows[day].push({
        artist: artist,
        location: location,
        time: time
      });
    }
    $('#' + div_id).remove();
    fn();
  });
};

var finished = {};

var load_page_unofficial = function(day, day_part, fn) {
  var shows_html, shows, url = 'http://showlistaustin.com/sxsw/' + sxsw_year + '/' + day.substr(0,3) + day_part + '.shtml',
      div_id = 'scraper-unofficial-' + day.substr(0,3) + day_part;
  fn = fn || noop;
  $('body').append('<div id="' + div_id + '" style="display: none;" />');
  $('#' + div_id).load(url + ' .printcontent', function(){
    shows_html = $('#' + div_id)[0].getElementsByTagName('ul')[0].innerHTML;
    shows = shows_html.split(/<hr style="color:#cccccc;"\s*\/*>/);
    for (var i = 0; i < shows.length; i++) {
      if (!shows[i]) continue;
      window.unofficial_shows[day].push(shows[i]);
    }
    $('#' + div_id).remove();
    finished[day].push(url);
    if (finished[day] && finished[day].length === 2) fn();
  });
};

var load_day_unofficial = function(day, fn) {
  var day_parts = ['day', 'night'];
  if (!window.unofficial_shows) window.unofficial_shows = {};
  if (already_loaded('unofficial_shows', day)) return fn();
  window.unofficial_shows[day] = [];
  finished[day] = [];
  for (var i = 0; i < day_parts.length; i++) {
    load_page_unofficial(day, day_parts[i], fn);
  }
};

var official_url = function(day) {
  var idx = sxsw_days.indexOf(day);
  if (idx === -1) return;
  day = idx + sxsw_start_day;
  return 'http://schedule.sxsw.com/?conference=music&day=' + day;
};

$('#filter_shows').bind('click', render_shows);
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
    var drop = models.Playlist.fromURI(e.dataTransfer.getData('text'));
    this.classList.remove('over');
    var success_message = document.createElement('p');
    success_message.innerHTML = 'Playlist successfully dropped: ' + drop.uri;
    this.appendChild(success_message);
    collectArtists(drop.uri);
}, false);
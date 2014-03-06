"use strict";

// Change these variables each year
var sxsw_year = '2014';
var sxsw_start_day = 11;

function official_url(day, ch) {
  return 'http://schedule.sxsw.com/?lsort=name&conference=music&day=' + day + '&a=' + ch;
}

function official_urls() {
	var sxsw_days = new Array();
	sxsw_days[sxsw_start_day] ='tuesday';
	sxsw_days[sxsw_start_day + 1] ='wednesday';
	sxsw_days[sxsw_start_day + 2] ='thursday';
	sxsw_days[sxsw_start_day + 3] ='friday';
	sxsw_days[sxsw_start_day + 4] ='saturday';
	sxsw_days[sxsw_start_day + 5] ='sunday';
	var official_urls = new Array();
	for (var i = 0; i <= 5; i++) {
		var sxsw_day = sxsw_start_day + i;
		if (i == 0) {
			var alphabet_str = 'a';
		} else {
			var alphabet_str = 'abcdefghijklmonpqrstuvwxyz1';
		}
		var day_item = {
			day: sxsw_days[sxsw_day],
			urls: []}
		for(var ch=0; ch<alphabet_str.length; ch++) {
			day_item.urls.push(official_url(sxsw_day, alphabet_str.charAt(ch)));
		}
		official_urls.push(day_item);
	}
	return official_urls;
}

var preload_shows = function() {

	window.official_shows = {};
	window.unofficial_shows = {};

	var unofficial_urls = new Array(
		{
			day: 'tuesday',
			urls: [	
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/tueday.shtml',
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/tuenight.shtml']
		},
		{
			day: 'wednesday',
			urls: [	
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/wedday.shtml',
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/wednight.shtml']
		},
				{
			day: 'thursday',
			urls: [	
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/thuday.shtml',
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/thunight.shtml']
		},
		{
			day: 'friday',
			urls: [	
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/friday.shtml',
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/frinight.shtml']
		},
		{
			day: 'saturday',
			urls: [	
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/satday.shtml',
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/satnight.shtml']
		},
		{
			day: 'sunday',
			urls: [	
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/sunday.shtml',
				'http://showlistaustin.com/sxsw/' + sxsw_year + '/sunnight.shtml']
		});

	unofficial_urls.forEach(function(day){
		window.unofficial_shows[day.day] = new Array();
		day.urls.forEach(function(url){
			pullShows(url, function(show_html){
				var cur_shows = show_html.split('<hr style="color:#cccccc;" />')
				cur_shows.shift()
				cur_shows.forEach(function(s){
					window.unofficial_shows[day.day].push(s)
				})
			})
		})
	})

	window.urls_to_load = official_urls();
	window.official_shows['tuesday'] = new Array();
	window.official_shows['wednesday'] = new Array();
	window.official_shows['thursday'] = new Array();
	window.official_shows['friday'] = new Array();
	window.official_shows['saturday'] = new Array();
	window.official_shows['sunday'] = new Array();
	preload_official_shows();

	$('#filter_shows').bind('click', function(){render_shows()});
	$('body').css('background-color','#fff');

}

function preload_official_shows() {
	if (window.urls_to_load.length > 0) {
		var day = window.urls_to_load[0];
		var url = window.urls_to_load[0].urls.shift();
		pullShows(url, function(show_html){
			var cur_shows = parseOfficial(show_html);
			cur_shows.forEach(function(s){
				if ($.inArray(s.artist, Object.keys(window.official_shows[day.day])) > -1) {
					window.official_shows[day.day][s.artist].push(s)
				} else {
					window.official_shows[day.day][s.artist] = new Array(s);
				}
			})
			if (window.urls_to_load[0].urls.length == 0) {
				window.urls_to_load.shift();
			}
			preload_official_shows();
		});
	} else {
		$('#filter_shows').prop('disabled', false);
	}
}

function pullShows(pull_url, callback) {
    $.ajax({
    	url: pull_url
    }).done(callback);
}

function parseOfficial(show_html) {
	var shows = new Array();
	var show_text = $(show_html.replace(/\/assets\//g, 'http://schedule.sxsw.com/assets/')).text();
	if (show_text.search('All Categories') > -1) {
		show_text = show_text.split('All Categories')[1].split('Add to my schedule');
		show_text.pop()
		show_text.forEach(function(row){
			var fields = row.trim().split(/\n+/);
			var artist = fields[0].trim();
			if (fields[5]) {
				var time = row.match(/[0-9]+\:[0-9]+[ap]m/i);
			} else {
				var time = '';
			}
			if (fields[6]) {
				var notes = fields[6].trim();
			} else {
				var notes = '';
			}
			shows.push({
				artist: artist,
				location: fields[3].trim(),
				time: time,
				notes: notes});

		});
	}
	return shows;
}

"use strict";

var preload_shows = function() {

	window.official_shows = {};
	window.unofficial_shows = {};

	var official_urls = new Array(
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=a', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=b', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=c', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=d', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=e', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=f', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=g', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=h', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=i', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=j', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=k', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=l', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=m', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=n', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=o', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=p', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=q', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=r', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=s', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=t', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=u', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=v', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=w', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=x', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=y', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=z', 
		'http://schedule.sxsw.com/?lsort=name&conference=music&day=ALL&a=1');

	var unofficial_urls = new Array(
		{
			day: 'tuesday',
			urls: [	
				'http://showlistaustin.com/sxsw/2013/tueday.shtml',
				'http://showlistaustin.com/sxsw/2013/tuenight.shtml']
		},
		{
			day: 'wednesday',
			urls: [	
				'http://showlistaustin.com/sxsw/2013/wedday.shtml',
				'http://showlistaustin.com/sxsw/2013/wednight.shtml']
		},
				{
			day: 'thursday',
			urls: [	
				'http://showlistaustin.com/sxsw/2013/thuday.shtml',
		'http://showlistaustin.com/sxsw/2013/thunight.shtml']
		},
		{
			day: 'friday',
			urls: [	
				'http://showlistaustin.com/sxsw/2013/friday.shtml',
				'http://showlistaustin.com/sxsw/2013/frinight.shtml']
		},
		{
			day: 'saturday',
			urls: [	
				'http://showlistaustin.com/sxsw/2013/satday.shtml',
				'http://showlistaustin.com/sxsw/2013/satnight.shtml']
		},
		{
			day: 'sunday',
			urls: [	
				'http://showlistaustin.com/sxsw/2013/sunday.shtml',
				'http://showlistaustin.com/sxsw/2013/sunnight.shtml']
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

	official_urls.forEach(function(url){
		pullShows(url, parseOfficial);
	})
	console.log(window.official_shows);

}

function pullShows(pull_url, callback) {
    $.ajax({
    	url: pull_url
    }).done(callback);
}

function parseOfficial(show_html) {
	var show_text = $(show_html).text();
	show_text = show_text.split('All Categories')[1].split('Add to my schedule');
	show_text.pop()
	show_text.forEach(function(row){
		var fields = row.trim().split(/\n+/);
		var artist = fields[0].trim();
		if ($.inArray(artist, Object.keys(window.official_shows)) > -1) {
			window.official_shows[artist].push({
				location: fields[3].trim(),
				day: fields[4].trim().split(', ')[0],
				time: fields[5].trim().split(/\s+/)[0],
				notes: fields[6].trim()});
		} else {
			window.official_shows[artist] = [{
					location: fields[3].trim(),
					day: fields[4].trim().split(', ')[0],
					time: fields[5].trim().split(/\s+/)[0],
					notes: fields[6].trim()
				}];
		}
	})
}

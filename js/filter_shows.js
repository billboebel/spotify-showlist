function draw_unofficial_shows(day) {
	$('#output').html('');
	var artist_pattern = new RegExp(window.artist_names.map(function(n){return "\\b" + n + "\\b";}).join('|'), "i");
	$.each(window.unofficial_shows[day], function(i, show){
		if (show.slice(show.indexOf('<li>'),show.length-1).search(artist_pattern) > -1) {
			$('#output').append('<br />' + show);
		}
	});
	$('#output').highlight(window.artist_names, { wordsOnly: true });
}

function filter_official_shows(day) {
	var filtered = {};
	$.each(window.artist_names, function(i, artist) {
		if ($.inArray(artist, Object.keys(window.official_shows[day])) > -1) {
			filtered[artist] = window.official_shows[day][artist];
		}
	});
	return filtered;
}

function draw_official_shows(day) {
	$('#output').html('');
    $.each(filter_official_shows(day), function(artist_name, artist_shows){
    	var output_str = "<p><a href='http://schedule.sxsw.com/search?q=" + artist_name + "'>" + 
    		artist_name + "</a><br />" + 
    		artist_shows.map(function(d){return [d.time, d.location].join(" at ")}).join("<br />") + 
    		"</p><br />";
    	$('#output').append(output_str);
    });
}

function render_shows() {
	var show_source = $('#show_source').val();
	var show_day = $('#show_day').val();
	if (show_source == 'official') {
		draw_official_shows(show_day);
	} else {
		draw_unofficial_shows(show_day);
	}
}
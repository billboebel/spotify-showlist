function draw_unofficial_shows(day) {
	$('#output').html('');
	var artist_pattern = new RegExp(window.artist_names.join('|'), "i");
	$.each(window.unofficial_shows[day], function(i, show){
		if (show.search(artist_pattern) > -1) {
			$('#output').append('<br />' + show);
		}

	});
	$.each(window.artist_names, function(j, a){
		$('#output').highlight(a, { wordsOnly: true });
	});
	$('.highlight').css('background-color', 'yellow');
	$('h4').css('font', '9px/14px Verdana, Arial, Helvetica, sans-serif');
	$('ul').css('list-style', 'square');
	$('li').css('margin-left', '10px');
	$('h4').css('margin-bottom', '0');
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
    		artist_shows.map(function(d){return "<p>" + [d.time, d.location].join("<br />") + "</p>"}) + 
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
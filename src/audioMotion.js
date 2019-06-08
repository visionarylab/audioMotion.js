/**
 * audioMotion.js
 * A real-time graphic spectrum analyzer and audio player using Web Audio and Canvas APIs
 *
 * https://github.com/hvianna/audioMotion.js
 *
 * Copyright (C) 2018-2019 Henrique Vianna <hvianna@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

var _VERSION = '19.6-dev';


/**
 * Global variables
 */
var audioStarted = false,
	// playlist, index to the current song, indexes to current and next audio elements
	playlist, playlistPos, currAudio, nextAudio,
	// HTML elements from the UI
	elMode, elFFTsize, elRangeMin, elRangeMax, elSmoothing, elGradient, elShowScale,
	elHighSens, elShowPeaks, elPlaylists, elBlackBg, elCycleGrad, elLedDisplay,
	elRepeat, elShowSong, elSource, elNoShadow, elLoRes,
	// configuration options we need to check inside the draw loop - for better performance
	cfgSource, cfgShowScale, cfgShowPeaks, cfgBlackBg,
	// data for drawing the analyzer bars and scale related variables
	analyzerBars, fMin, fMax, deltaX, bandWidth, barWidth, ledOptions,
	// Web Audio API related variables
	audioCtx, analyzer, audioElement, bufferLength, dataArray, sourcePlayer, sourceMic,
	// canvas related variables
	canvas, canvasCtx, pixelRatio, canvasMsg,
	// octaves center frequencies (for X-axis scale labels)
	bands = [ 16, 31, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000 ],
	// gradient definitions
	gradients = {
		apple:    { name: 'Apple ][', bgColor: '#111', colorStops: [
					{ stop: .1667, color: '#61bb46' },
					{ stop: .3333, color: '#fdb827' },
					{ stop: .5, color: '#f5821f' },
					{ stop: .6667, color: '#e03a3e' },
					{ stop: .8333, color: '#963d97' },
					{ stop: 1, color: '#009ddc' }
				  ] },
		aurora:   { name: 'Aurora', bgColor: '#0e172a', colorStops: [
					{ stop: .1, color: 'hsl( 120, 100%, 50% )' },
					{ stop:  1, color: 'hsl( 216, 100%, 50% )' }
				  ] },
		borealis:  { name: 'Borealis', bgColor: '#0d1526', colorStops: [
					{ stop: .1, color: 'hsl( 120, 100%, 50% )' },
					{ stop: .5, color: 'hsl( 189, 100%, 40% )' },
					{ stop:  1, color: 'hsl( 290, 60%, 40% )' }
				  ] },
		candy:    { name: 'Candy', bgColor: '#0d0619', colorStops: [
				 	{ stop: .1, color: '#ffaf7b' },
				 	{ stop: .5, color: '#d76d77' },
				 	{ stop: 1, color: '#3a1c71' }
				  ] },
		classic:  { name: 'Classic', bgColor: '#111', colorStops: [
					{ stop: 0, color: 'hsl( 0, 100%, 50% )' },
					{ stop: .6, color: 'hsl( 60, 100%, 50% )' },
					{ stop:  1, color: 'hsl( 120, 100%, 50% )' }
				  ] },
		dusk:     { name: 'Dusk', bgColor: '#0e172a', colorStops: [
					{ stop: .2, color: 'hsl( 55, 100%, 50% )' },
					{ stop:  1, color: 'hsl( 16, 100%, 50% )' }
				  ] },
		miami:    { name: 'Miami', bgColor: '#110a11', colorStops: [
				    { stop: .024, color: 'rgb( 251, 198, 6 )' },
				    { stop: .283, color: 'rgb( 224, 82, 95 )' },
				    { stop: .462, color: 'rgb( 194, 78, 154 )' },
				    { stop: .794, color: 'rgb( 32, 173, 190 )' },
				    { stop: 1, color: 'rgb( 22, 158, 95 )' }
				  ] },
		orient:   { name: 'Orient', bgColor: '#100', colorStops: [
					{ stop: .1, color: '#f00' },
					{ stop: 1, color: '#600' }
				  ] },
		outrun:   { name: 'Outrun', bgColor: '#101', colorStops: [
					{ stop: 0, color: 'rgb( 255, 223, 67 )' },
					{ stop: .182, color: 'rgb( 250, 84, 118 )' },
					{ stop: .364, color: 'rgb( 198, 59, 243 )' },
					{ stop: .525, color: 'rgb( 133, 80, 255 )' },
					{ stop: .688, color: 'rgb( 74, 104, 247 )' },
					{ stop: 1, color: 'rgb( 35, 210, 255 )' }
		          ] },
		pacific:  { name: 'Pacific Dream', bgColor: '#051319', colorStops: [
				 	{ stop: .1, color: '#34e89e' },
				 	{ stop: 1, color: '#0f3443' }
				  ] },
		prism:    { name: 'Prism', bgColor: '#111' },
		rainbow:  { name: 'Rainbow', bgColor: '#111' },
		shahabi:  { name: 'Shahabi', bgColor: '#060613', colorStops: [
				 	{ stop: .1, color: '#66ff00' },
				 	{ stop: 1, color: '#a80077' }
				  ] },
		summer:   { name: 'Summer', bgColor: '#041919', colorStops: [
				 	{ stop: .1, color: '#fdbb2d' },
				 	{ stop: 1, color: '#22c1c3' }
				  ] },
		sunset:   { name: 'Sunset', bgColor: '#021119', colorStops: [
				 	{ stop: .1, color: '#f56217' },
				 	{ stop: 1, color: '#0b486b' }
				  ] },
		tiedye:   { name: 'Tie Dye', bgColor: '#111', colorStops: [
					{ stop: .038, color: 'rgb( 15, 209, 165 )' },
					{ stop: .208, color: 'rgb( 15, 157, 209 )' },
					{ stop: .519, color: 'rgb( 133, 13, 230 )' },
					{ stop: .731, color: 'rgb( 230, 13, 202 )' },
					{ stop: .941, color: 'rgb( 242, 180, 107 )' }
		          ] },
	};

/**
 * Configuration presets
 */
var presets = {
		default: {
			mode        : 0,	    // discrete frequencies mode
			fftSize     : 8192,		// FFT size
			freqMin     : 20,		// lowest frequency
			freqMax     : 22000,	// highest frequency
			smoothing   : 0.5,		// 0 to 0.9 - smoothing time constant
			gradient    : 'prism',
			blackBg     : 0,
			cycleGrad   : 1,
			ledDisplay  : 0,
			showScale   : 1,
			highSens    : 0,
			showPeaks   : 1,
			showSong    : 1,
			repeat      : 0,
			noShadow    : 1,
			loRes       : 0
		},

		fullres: {
			mode        : 0,
			fftSize     : 8192,
			freqMin     : 20,
			freqMax     : 22000,
			smoothing   : 0.5
		},

		octave: {
			mode        : 4,		// 1/6th octave bands mode
			fftSize     : 8192,
			freqMin     : 30,
			freqMax     : 16000,
			smoothing   : 0.5
		},

		ledbars: {
			mode        : 2,		// 1/12th octave bands mode
			fftSize     : 8192,
			freqMin     : 30,
			freqMax     : 16000,
			smoothing   : 0.5,
			blackBg     : 0,
			ledDisplay  : 1,
			showScale   : 0
		}
	};


/**
 * Start audio elements on user gesture (click or keypress)
 */
function initAudio() {
	// fix for suspended audio context on Safari
	if ( audioCtx.state == 'suspended' )
		audioCtx.resume();

	if ( ! audioStarted ) {
		audioElement[0].play();
		audioElement[1].play();
		window.removeEventListener( 'click', initAudio );
	}
}

/**
 * Display the canvas in full-screen mode
 */
function fullscreen() {

	if ( document.fullscreenElement ) {
		document.exitFullscreen();
	}
	else {
		if ( canvas.requestFullscreen )
			canvas.requestFullscreen();
		else if ( canvas.webkitRequestFullscreen )
			canvas.webkitRequestFullscreen();
		else if ( canvas.mozRequestFullScreen )
			canvas.mozRequestFullScreen();
		else if ( canvas.msRequestFullscreen )
			canvas.msRequestFullscreen();
		document.getElementById('fullscreen_button').blur();
	}
}

/**
 * Adjust the analyzer's sensitivity
 */
function setSensitivity() {
	if ( elHighSens.dataset.active == '1' ) {
		analyzer.minDecibels = -100; // WebAudio API defaults
		analyzer.maxDecibels = -30;
	}
	else {
		analyzer.minDecibels = -85;
		analyzer.maxDecibels = -25;
	}
	updateLastConfig();
}

/**
 * Set the smoothing time constant
 */
function setSmoothing() {
	analyzer.smoothingTimeConstant = elSmoothing.value;
	consoleLog( 'smoothingTimeConstant is ' + analyzer.smoothingTimeConstant );
	updateLastConfig();
}

/**
 * Set the size of the FFT performed by the analyzer node
 */
function setFFTsize() {

	analyzer.fftSize = elFFTsize.value;

	// update all variables that depend on the FFT size
	bufferLength = analyzer.frequencyBinCount;
	dataArray = new Uint8Array( bufferLength );

	consoleLog( 'FFT size is ' + analyzer.fftSize + ' samples' );
	updateLastConfig();

	preCalcPosX();
}

/**
 * Set desired frequency range
 */
function setFreqRange() {
	while ( Number( elRangeMax.value ) <= Number( elRangeMin.value ) )
		elRangeMax.selectedIndex++;
	updateLastConfig();
	preCalcPosX();
}

/**
 * Set scale preferences
 */
function setScale() {
	updateLastConfig();
	preCalcPosX();
}

/**
 * Set show peaks preference
 */
function setShowPeaks() {
	cfgShowPeaks = ( elShowPeaks.dataset.active == '1' );
	updateLastConfig();
}

/**
 * Set background color preference
 */
function setBlackBg() {
	cfgBlackBg = ( elBlackBg.dataset.active == '1' );
	updateLastConfig();
}


/**
 * Pre-calculate the actual X-coordinate on screen for each analyzer bar
 */
function preCalcPosX() {

	fMin = elRangeMin.value;
	fMax = elRangeMax.value;

	var i, freq;

	cfgShowScale = ( elShowScale.dataset.active == '1' );

	deltaX = Math.log10( fMin );
	bandWidth = canvas.width / ( Math.log10( fMax ) - deltaX );

	analyzerBars = [];

	if ( elMode.value == '0' ) {
	// discrete frequencies
 		var pos, lastPos = -1;
		iMin = Math.floor( fMin * analyzer.fftSize / audioCtx.sampleRate ),
		iMax = Math.round( fMax * analyzer.fftSize / audioCtx.sampleRate );
		barWidth = 1;

		for ( i = iMin; i <= iMax; i++ ) {
			freq = i * audioCtx.sampleRate / analyzer.fftSize; // frequency represented in this bin
			pos = Math.round( bandWidth * ( Math.log10( freq ) - deltaX ) ); // avoid fractionary pixel values

			// if it's on a different X-coordinate, create a new bar for this frequency
			if ( pos > lastPos ) {
				analyzerBars.push( { posX: pos, dataIdx: i, endIdx: 0, average: false, peak: 0, hold: 0, accel: 0 } );
				lastPos = pos;
			} // otherwise, add this frequency to the last bar's range
			else if ( analyzerBars.length )
				analyzerBars[ analyzerBars.length - 1 ].endIdx = i;
		}
	}
	else {
	// octave bands

		switch ( elMode.value ) {
			case '24':
				ledOptions = { nLeds: 24, spaceV: 16, spaceH: 24 };
				break;

			case '12':
				ledOptions = { nLeds: 48, spaceV: 8, spaceH: 16 };
				break;

			case  '8':
				ledOptions = { nLeds: 64, spaceV: 6, spaceH: 10 };
				break;

			case  '4':
				ledOptions = { nLeds: 80, spaceV: 6, spaceH: 8 };
				break;

			case  '2':
				ledOptions = { nLeds: 128, spaceV: 4, spaceH: 4 };
				break;

			default:
				ledOptions = { nLeds: 128, spaceV: 3, spaceH: 4 };
		}

		ledOptions.spaceH *= pixelRatio;
		ledOptions.spaceV *= pixelRatio;
		ledOptions.ledHeight = canvas.height / ledOptions.nLeds - ledOptions.spaceV;

		// generate a table of frequencies based on the equal tempered scale
		var root24 = 2 ** ( 1 / 24 ); // for 1/24th-octave bands
		var c0 = 440 * root24 ** -114;
		var temperedScale = [];
		var prevBin = 0;

		i = 0;
		while ( ( freq = c0 * root24 ** i ) <= fMax ) {
			if ( freq >= fMin && i % elMode.value == 0 )
				temperedScale.push( freq );
			i++;
		}

		// canvas space will be divided by the number of frequencies we have to display
		barWidth = Math.floor( canvas.width / temperedScale.length ) - 1;
		var barSpace = Math.round( canvas.width - barWidth * temperedScale.length ) / ( temperedScale.length - 1 );

		temperedScale.forEach( function( freq, index ) {
			// which FFT bin represents this frequency?
			var bin = Math.round( freq * analyzer.fftSize / audioCtx.sampleRate );

			var idx, nextBin, avg = false;
			// start from the last used FFT bin
			if ( prevBin > 0 && prevBin + 1 <= bin )
				idx = prevBin + 1;
			else
				idx = bin;

			prevBin = nextBin = bin;
			// check if there's another band after this one
			if ( temperedScale[ index + 1 ] !== undefined ) {
				nextBin = Math.round( temperedScale[ index + 1 ] * analyzer.fftSize / audioCtx.sampleRate );
				// and use half the bins in between for this band
				if ( nextBin - bin > 1 )
					prevBin += Math.round( ( nextBin - bin ) / 2 );
				else if ( nextBin - bin == 1 ) {
				// for low frequencies the FFT may not provide as many coefficients as we need, so more than one band will use the same FFT data
				// in these cases, we set a flag to perform an average to smooth the transition between adjacent bands
					if ( analyzerBars.length > 0 && idx == analyzerBars[ analyzerBars.length - 1 ].dataIdx ) {
						avg = true;
						prevBin += Math.round( ( nextBin - bin ) / 2 );
					}
				}
			}

			analyzerBars.push( {
				posX: index * ( barWidth + barSpace ),
				dataIdx: idx,
				endIdx: prevBin - idx > 0 ? prevBin : 0,
				average: avg,
				peak: 0,
				hold: 0,
				accel: 0
			} );
		} );
	}

	drawScale();
}

/**
 * Draws the x-axis scale
 */
function drawScale() {

	canvasCtx.fillStyle = '#000';
	canvasCtx.fillRect( 0, canvas.height - 20 * pixelRatio, canvas.width, 20 * pixelRatio );

	if ( ! cfgShowScale )
		return;

	canvasCtx.fillStyle = '#fff';
	canvasCtx.font = ( 10 * pixelRatio ) + 'px sans-serif';
	canvasCtx.textAlign = 'center';

	bands.forEach( function( freq ) {
		var posX = bandWidth * ( Math.log10( freq ) - deltaX );
		canvasCtx.fillText( freq >= 1000 ? ( freq / 1000 ) + 'k' : freq, posX, canvas.height - 5 * pixelRatio );
	});

}

/**
 * Clear the playlist
 */
function clearPlaylist() {

	while ( playlist.hasChildNodes() )
		playlist.removeChild( playlist.firstChild );

	if ( ! isPlaying() ) {
		playlistPos = 0;
		audioElement[0].src = '';
		audioElement[1].src = '';
	}
	else
		playlistPos = -1;

	updatePlaylistUI();
}

/**
 * Load playlists from localStorage and legacy playlists.cfg file
 */
function loadSavedPlaylists( keyName ) {

	var list, item, n = 0,
		playlists = localStorage.getItem('playlists');

	while ( elPlaylists.hasChildNodes() )
		elPlaylists.removeChild( elPlaylists.firstChild );

	item = new Option( 'Select a playlist to load, update or delete', '' );
	item.disabled = true;
	item.selected = true;
	elPlaylists.options[ elPlaylists.options.length ] = item;

	if ( playlists ) {
		playlists = JSON.parse( playlists );

		Object.keys( playlists ).forEach( key => {
			item = new Option( playlists[ key ], key );
			item.dataset.isLocal = '1';
			if ( key == keyName )
				item.selected = true;
			elPlaylists.options[ elPlaylists.options.length ] = item;
		});
	}

	fetch( 'playlists.cfg' )
		.then( function( response ) {
			if ( response.status == 200 )
				return response.text();
			else
				consoleLog( 'No playlists.cfg file found', true );
		})
		.then( function( content ) {
			list = content.split(/[\r\n]+/);
			for ( var i = 0; i < list.length; i++ ) {
				if ( list[ i ].charAt(0) != '#' && list[ i ].trim() != '' ) { // not a comment or blank line?
					item = list[ i ].split(/\|/);
					if ( item.length == 2 ) {
						elPlaylists.options[ elPlaylists.options.length ] = new Option( item[0].trim(), item[1].trim() );
						n++;
					}
				}
			}
			if ( n )
				consoleLog( n + ' playlists found in playlists.cfg' );
			else
				consoleLog( 'No playlists found in playlists.cfg', true );
		})
		.catch( function( err ) {
			consoleLog( 'Could not read from playlists.cfg', true );
		});
}

/**
 * Add a song to the playlist
 */
function addToPlaylist( content ) {

	var title = content.common.title || content.file.substring( content.file.lastIndexOf('/') + 1 );

	var el = document.createElement('li');

	el.innerHTML = title;
	el.dataset.artist = content.common.artist || '';
	el.dataset.title = title;
//	el.dataset.album = content.common.album ? content.common.album + ( content.common.year ? ' (' + content.common.year + ')' : '' ) : '';
	el.dataset.codec = content.format ? content.format.codec || content.format.container : content.file.substring( content.file.lastIndexOf('.') + 1 );
//	el.dataset.samplerate = content.format && content.format.sampleRate || '';
//	el.dataset.bitdepth = content.format && content.format.bitsPerSample || '';
//	el.dataset.cover = content.common.picture ? 'get' : '';
	el.dataset.file = content.file.replace( /#/g, '%23' ); // replace any '#' character in the filename for its URL-safe code

	playlist.appendChild( el );
}


/**
 * Load a playlist file into the current playlist
 */
function loadPlaylist( path ) {

	var tmplist, ext, songInfo, t,
		n = 0;

	if ( ! path )
		return;

	ext = path.substring( path.lastIndexOf('.') + 1 ).toLowerCase();

	if ( ext == 'm3u' || ext == 'm3u8' ) {
		fetch( path )
			.then( function( response ) {
				if ( response.status == 200 )
					return response.text();
				else
					consoleLog( 'Fetch returned error code ' + response.status, true );
			})
			.then( function( content ) {
				tmplist = content.split(/[\r\n]+/);
				path = path.substring( 0, path.lastIndexOf('/') + 1 );
				for ( var i = 0; i < tmplist.length; i++ ) {
					if ( tmplist[ i ].charAt(0) != '#' && tmplist[ i ].trim() != '' ) { // not a comment or blank line?
						n++;
						if ( ! songInfo ) { // if no previous #EXTINF tag, extract info from the filename
							songInfo = tmplist[ i ].substring( Math.max( tmplist[ i ].lastIndexOf('/'), tmplist[ i ].lastIndexOf('\\') ) + 1 );
							songInfo = songInfo.substring( 0, songInfo.lastIndexOf('.') ).replace( /_/g, ' ' );
						}
						if ( tmplist[ i ].substring( 0, 4 ) != 'http' )
							tmplist[ i ] = path + tmplist[ i ];
						t = songInfo.indexOf(' - ');
						if ( t == -1 )
							addToPlaylist( { file: tmplist[ i ], common: { artist: '', title: songInfo } } );
						else
							addToPlaylist( { file: tmplist[ i ], common: { artist: songInfo.substring( 0, t ), title: songInfo.substring( t + 3 ) } } );
						songInfo = '';
					}
					else if ( tmplist[ i ].substring( 0, 7 ) == '#EXTINF' )
						songInfo = tmplist[ i ].substring( tmplist[ i ].indexOf(',') + 1 || 8 ); // info will be saved for the next iteration
				}
				consoleLog( 'Loaded ' + n + ' files into the playlist' );
//				updatePlaylistUI();
				if ( ! isPlaying() )
					loadSong( 0 );
				else
					loadNextSong();
			})
			.catch( function( err ) {
				consoleLog( err, true );
			});
	}
	else { // try to load playlist from localStorage
		tmplist = localStorage.getItem( 'pl_' + path );
		if ( tmplist ) {
			tmplist = JSON.parse( tmplist );
			tmplist.forEach( item => {
				songInfo = item.substring( Math.max( item.lastIndexOf('/'), item.lastIndexOf('\\') ) + 1 );
				songInfo = songInfo.substring( 0, songInfo.lastIndexOf('.') ).replace( /_/g, ' ' );
				addToPlaylist( { file: item, common: { artist: '', title: songInfo } } )
			});
		}
		else
			consoleLog( 'Unrecognized playlist file - ' + path, true );
	}
}

/**
 * Save/update an existing playlist
 */
function savePlaylist( index ) {

	if ( playlist.children.length == 0 )
		alert( 'Playlist is empty!' );
	else if ( elPlaylists[ index ].value == '' )
		storePlaylist();
	else if ( ! elPlaylists[ index ].dataset.isLocal )
		alert( 'This is a server playlist which cannot be overwritten.\n\nChoose "Save as" to create a new local playlist.' );
	else
		if ( confirm( `Overwrite "${elPlaylists[ index ].innerText}" with current playlist contents?` ) )
			storePlaylist( elPlaylists[ index ].value );
}

/**
 * Store a playlist in localStorage
 */
function storePlaylist( name ) {

	var overwrite = false;

	if ( ! name )
		name = prompt( 'Save current playlist as:' );
	else
		overwrite = true;

	if ( name ) {
		var safename = name;

		if ( ! overwrite ) {
			safename = safename.normalize('NFD').replace( /[\u0300-\u036f]/g, '' ); // remove accents
			safename = safename.toLowerCase().replace( /[^a-z0-9]/g, '_' );

			var playlists = localStorage.getItem('playlists');

			if ( playlists )
				playlists = JSON.parse( playlists );
			else
				playlists = {};

			while ( ! overwrite && playlists.hasOwnProperty( safename ) )
				safename += '_1';

			playlists[ safename ] = name;

			localStorage.setItem( 'playlists', JSON.stringify( playlists ) );
			loadSavedPlaylists( safename );
		}

		var songs = [];
		playlist.childNodes.forEach( item => songs.push( item.dataset.file ) );

		localStorage.setItem( 'pl_' + safename, JSON.stringify( songs ) );
	}
}

/**
 * Delete a playlist from localStorage
 */
function deletePlaylist( index ) {
	if ( confirm( `Do you really want to DELETE the "${elPlaylists[ index ].innerText}" playlist?\n\nTHIS CANNOT BE UNDONE!` ) ) {
		var keyName = elPlaylists[ index ].value;
		var playlists = localStorage.getItem('playlists');

		if ( playlists ) {
			playlists = JSON.parse( playlists );
			delete playlists[ keyName ];
			localStorage.setItem( 'playlists', JSON.stringify( playlists ) );
		}

		localStorage.removeItem( `pl_${keyName}` );
		loadSavedPlaylists();
	}

}

/**
 * Update the playlist shown to the user
 */
function updatePlaylistUI() {

	var current = playlist.querySelector('.current');
	if ( current )
		current.className = '';

	if ( playlistPos < playlist.children.length )
		playlist.children[ playlistPos ].className = 'current';
}

/**
 * Shuffle the playlist
 */
function shufflePlaylist() {

	var temp, r;

	for ( var i = playlist.children.length - 1; i > 0; i-- ) {
		r = Math.floor( Math.random() * ( i + 1 ) );
		temp = playlist.replaceChild( playlist.children[ r ], playlist.children[ i ] );
		playlist.insertBefore( temp, playlist.children[ r ] );
	}

	playSong(0);
	updatePlaylistUI();
}

/**
 * Return the index of an element inside its parent
 * https://stackoverflow.com/questions/13656921/fastest-way-to-find-the-index-of-a-child-node-in-parent
 */
function getIndex( node ) {
	if ( ! node )
		return undefined;
	var i = 0;
	while ( node = node.previousElementSibling )
		i++;
	return i;
}

/**
 * Load a song into the currently active audio element
 */
function loadSong( n ) {
	if ( playlist.children[ n ] ) {
		playlistPos = n;
		audioElement[ currAudio ].src = playlist.children[ playlistPos ].dataset.file;
		audioElement[ currAudio ].dataset.artist = playlist.children[ playlistPos ].dataset.artist;
		audioElement[ currAudio ].dataset.title = playlist.children[ playlistPos ].dataset.title;
		audioElement[ currAudio ].dataset.codec = playlist.children[ playlistPos ].dataset.codec;

		updatePlaylistUI();

		loadNextSong();
		return true;
	}
	else
		return false;
}

/**
 * Loads next song into the audio element not currently in use
 */
function loadNextSong() {
	var n;
	audioElement[ nextAudio ].pause();
	if ( playlistPos < playlist.children.length - 1 )
		n = playlistPos + 1;
	else
		n = 0;
	audioElement[ nextAudio ].src = playlist.children[ n ].dataset.file;
	audioElement[ nextAudio ].dataset.artist = playlist.children[ n ].dataset.artist;
	audioElement[ nextAudio ].dataset.title = playlist.children[ n ].dataset.title;
	audioElement[ nextAudio ].dataset.codec = playlist.children[ n ].dataset.codec;
}

/**
 * Play a song from the playlist
 */
function playSong( n ) {

	if ( cfgSource == 'mic' )
		return;

	if ( loadSong( n ) )
		audioElement[ currAudio ].play();
}

/**
 * Player controls
 */
function playPause() {
	if ( cfgSource == 'mic' )
		return;
	if ( isPlaying() )
		audioElement[ currAudio ].pause();
	else
		audioElement[ currAudio ].play();
}

function stop() {
	if ( cfgSource == 'mic' )
		return;
	audioElement[ currAudio ].pause();
	setCanvasMsg();
	loadSong( 0 );
}

function playPreviousSong() {
	if ( cfgSource == 'mic' )
		return;
	if ( isPlaying() )
		playSong( playlistPos - 1 );
	else
		loadSong( playlistPos - 1 );
}

function playNextSong( play ) {

	if ( cfgSource == 'mic' || playlistPos > playlist.children.length - 1 )
		return;

	var gradIdx;

	if ( playlistPos < playlist.children.length - 1 )
		playlistPos++;
	else if ( elRepeat.dataset.active == '1' )
		playlistPos = 0;
	else return;

	play = play || isPlaying();

	currAudio = ! currAudio | 0;
	nextAudio = ! currAudio | 0;

	audioElement[ nextAudio ].style.display = 'none';
	audioElement[ currAudio ].style.display = 'block';

	if ( play ) {
		audioElement[ currAudio ].play()
			.then( loadNextSong )
			.catch( function( err ) {
				consoleLog( err, true );
				loadNextSong();
			});
		if ( elCycleGrad.dataset.active == '1' ) {
			gradIdx = elGradient.selectedIndex;
			if ( gradIdx < elGradient.options.length - 1 )
				gradIdx++;
			else
				gradIdx = 0;
			elGradient.selectedIndex = gradIdx;
		}
	}
	else
		loadNextSong();

	updatePlaylistUI();
}

/**
 * Check if audio is playing
 */
function isPlaying() {
	return audioElement[ currAudio ]
		&& audioElement[ currAudio ].currentTime > 0
		&& !audioElement[ currAudio ].paused
		&& !audioElement[ currAudio ].ended;
//		&& audioElement.readyState > 2;
}

/**
 * Draws outlined text on canvas
 */
function outlineText( text, x, y, maxWidth ) {
	if ( elNoShadow.dataset.active == '1') {
		canvasCtx.strokeText( text, x, y, maxWidth );
		canvasCtx.fillText( text, x, y, maxWidth );
	}
	else {
		canvasCtx.shadowOffsetX = canvasCtx.shadowOffsetY = 3 * pixelRatio;
		canvasCtx.fillText( text, x, y, maxWidth );
		canvasCtx.shadowOffsetX = canvasCtx.shadowOffsetY = 0;
	}
}

/**
 * Display message on canvas
 */
function displayCanvasMsg() {

	var curTime, duration;

	var	fontSize    = canvas.width / 28, // base font size - all the following measures are relative to this
		leftPos     = fontSize,
		rightPos    = canvas.width - fontSize,
		centerPos   = canvas.width / 2,
		topLine     = fontSize * 1.4,
		bottomLine1 = canvas.height - fontSize * 3,
		bottomLine2 = canvas.height - fontSize * 1.6,
		maxWidth    = canvas.width - fontSize * 6.6,  // maximum width for artist and song name
		maxWidthTop = canvas.width / 3 - fontSize;    // maximum width for messages shown at the top of screen

	if ( canvasMsg.timer > canvasMsg.fade ) {
		canvasCtx.fillStyle = '#fff';
		canvasCtx.strokeStyle = canvasCtx.shadowColor = '#000';
	}
	else {
		canvasCtx.fillStyle = 'rgba( 255, 255, 255, ' + ( canvasMsg.timer / canvasMsg.fade ) + ')';
		canvasCtx.strokeStyle = canvasCtx.shadowColor = 'rgba( 0, 0, 0, ' + ( canvasMsg.timer / canvasMsg.fade ) + ')';
	}

	canvasCtx.font = 'bold ' + ( fontSize * .7 ) + 'px sans-serif';
	canvasCtx.textAlign = 'center';

	if ( canvasMsg.msg != 'all' && canvasMsg.msg != 'song' ) {
		outlineText( canvasMsg.msg, centerPos, topLine );
	}
	else {
		if ( canvasMsg.msg == 'all' ) {
			outlineText( 'Gradient: ' + gradients[ elGradient.value ].name, centerPos, topLine, maxWidthTop );
			outlineText( 'Auto gradient is ' + ( elCycleGrad.dataset.active == '1' ? 'ON' : 'OFF' ), centerPos, topLine * 1.8 );

			canvasCtx.textAlign = 'left';
			outlineText( elMode[ elMode.selectedIndex ].text, leftPos, topLine, maxWidthTop );

			canvasCtx.textAlign = 'right';
			outlineText( 'Repeat is ' + ( elRepeat.dataset.active == '1' ? 'ON' : 'OFF' ), rightPos, topLine, maxWidthTop );
		}

		// file type and time
		if ( audioElement[ currAudio ].duration ) {
			canvasCtx.textAlign = 'right';
			outlineText( audioElement[ currAudio ].dataset.codec, rightPos, bottomLine1 );
			curTime = Math.floor( audioElement[ currAudio ].currentTime / 60 ) + ':' + ( "0" + Math.floor( audioElement[ currAudio ].currentTime % 60 ) ).slice(-2);
			duration = Math.floor( audioElement[ currAudio ].duration / 60 ) + ':' + ( "0" + Math.floor( audioElement[ currAudio ].duration % 60 ) ).slice(-2);
			outlineText( curTime + ' / ' + duration, rightPos, bottomLine2 );
		}
		// artist and song name
		canvasCtx.textAlign = 'left';
		outlineText( audioElement[ currAudio ].dataset.artist.toUpperCase(), leftPos, bottomLine1, maxWidth );
		canvasCtx.font = 'bold ' + fontSize + 'px sans-serif';
		outlineText( audioElement[ currAudio ].dataset.title, leftPos, bottomLine2, maxWidth );
	}
}

/**
 * Set message for on-screen display
 */
function setCanvasMsg( msg, timer = 120, fade = 60 ) {
	if ( ! msg )
		canvasMsg = { timer: 0 };
	else
		canvasMsg = { msg: msg, timer: timer, fade: fade };
}

/**
 * Redraw the canvas
 * this is called 60 times per second by requestAnimationFrame()
 */
function draw() {

	var grad = elGradient.value,
		i, j, l, bar, barHeight,
		isLedDisplay = ( elLedDisplay.dataset.active == '1' && elMode.value != '0' );

//	document.body.className = isPlaying() ? 'playing' : '';

	if ( cfgBlackBg )	// use black background
		canvasCtx.fillStyle = '#000';
	else
		if ( isLedDisplay )
			canvasCtx.fillStyle = '#111';
		else
			canvasCtx.fillStyle = gradients[ grad ].bgColor; // use background color defined by gradient

	// clear the canvas
	canvasCtx.fillRect( 0, 0, canvas.width, canvas.height );

	// get a new array of data from the FFT
	analyzer.getByteFrequencyData( dataArray );

	l = analyzerBars.length;
	for ( i = 0; i < l; i++ ) {

		bar = analyzerBars[ i ];

		if ( bar.endIdx == 0 ) 	// single FFT bin
			barHeight = dataArray[ bar.dataIdx ] / 255 * canvas.height;
		else { 					// range of bins
			barHeight = 0;
			if ( bar.average ) {
				// use the average value of the range
				for ( j = bar.dataIdx; j <= bar.endIdx; j++ )
					barHeight += dataArray[ j ];
				barHeight = barHeight / ( bar.endIdx - bar.dataIdx + 1 ) / 255 * canvas.height;
			}
			else {
				// use the highest value in the range
				for ( j = bar.dataIdx; j <= bar.endIdx; j++ )
					barHeight = Math.max( barHeight, dataArray[ j ] );
				barHeight = barHeight / 255 * canvas.height;
			}
		}

		if ( isLedDisplay ) // normalize barHeight to match one of the "led" elements
			barHeight = Math.floor( barHeight / canvas.height * ledOptions.nLeds ) * ( ledOptions.ledHeight + ledOptions.spaceV );

		if ( barHeight > bar.peak ) {
			bar.peak = barHeight;
			bar.hold = 30; // set peak hold time to 30 frames (0.5s)
			bar.accel = 0;
		}

		canvasCtx.fillStyle = gradients[ grad ].gradient;
		if ( isLedDisplay )
			canvasCtx.fillRect( bar.posX + ledOptions.spaceH / 2, canvas.height, barWidth, -barHeight );
		else
			canvasCtx.fillRect( bar.posX, canvas.height, barWidth, -barHeight );

		if ( bar.peak > 0 ) {
			if ( cfgShowPeaks )
				if ( isLedDisplay )
					canvasCtx.fillRect( bar.posX + ledOptions.spaceH / 2, ( ledOptions.nLeds - Math.floor( bar.peak / canvas.height * ledOptions.nLeds ) ) * ( ledOptions.ledHeight + ledOptions.spaceV ), barWidth, ledOptions.ledHeight );
				else
					canvasCtx.fillRect( bar.posX, canvas.height - bar.peak, barWidth, 2 );

			if ( bar.hold )
				bar.hold--;
			else {
				bar.accel++;
				bar.peak -= bar.accel;
			}
		}

		if ( isLedDisplay ) {
			canvasCtx.fillStyle = '#000';	// clears a vertical line to the left of this bar, to separate the LED columns
			canvasCtx.fillRect( bar.posX - ledOptions.spaceH / 2, 0, ledOptions.spaceH, canvas.height );
		}

	}

	if ( isLedDisplay ) {
		canvasCtx.fillStyle = '#000';
		if ( elMode.value > 1 )	// clears rightmost vertical line
			canvasCtx.fillRect( canvas.width - ledOptions.spaceH / 2, 0, ledOptions.spaceH, canvas.height );
		// add horizontal black lines to separate the LEDs
		for ( j = ledOptions.ledHeight; j < canvas.height; j += ledOptions.ledHeight + ledOptions.spaceV )
			canvasCtx.fillRect( 0, j, canvas.width, ledOptions.spaceV );
	}

	if ( cfgShowScale )
		drawScale();

	if ( canvasMsg.timer > 0 ) {
		displayCanvasMsg();
		if ( ! --canvasMsg.timer )
			setCanvasMsg(); // clear messages
	}

	// if it's less than 50ms from the end of the song, start the next one (for improved gapless playback)
	if ( audioElement[ currAudio ].duration - audioElement[ currAudio ].currentTime < .05 )
		audioOnEnded();

	// schedule next canvas update
	requestAnimationFrame( draw );
}

/**
 * Output messages to the UI "console"
 */
function consoleLog( msg, error ) {
	var elConsole = document.getElementById( 'console' );
	if ( error ) {
		msg = '<span class="error"><i class="icons8-warn"></i> ' + msg + '</span>';
		document.getElementById( 'show_console' ).className = 'warning';
	}
	elConsole.innerHTML += msg + '<br>';
	elConsole.scrollTop = elConsole.scrollHeight;
}

/**
 * Change audio input source
 */
function setSource() {

	cfgSource = elSource.value;

	if ( cfgSource == 'mic' ) {
		if ( typeof sourceMic == 'object' ) {
			if ( isPlaying() )
				audioElement[ currAudio ].pause();
			sourceMic.connect( analyzer );
		}
		else { // if sourceMic is not set yet, ask user's permission to use the microphone
			navigator.mediaDevices.getUserMedia( { audio: true, video: false } )
			.then( function( stream ) {
				sourceMic = audioCtx.createMediaStreamSource( stream );
				consoleLog( 'Audio source set to microphone' );
				setSource(); // recursive call, sourceMic is now set
			})
			.catch( function( err ) {
				consoleLog( 'Could not change audio source', true );
				elSource.selectedIndex = 0; // revert to player
				cfgSource = 'player';
			});
		}
	}
	else {
		if ( typeof sourceMic == 'object' )
			sourceMic.disconnect( analyzer );
		consoleLog( 'Audio source set to built-in player' );
	}

}

/**
 * Load a music file from the user's computer
 */
function loadLocalFile( obj ) {

	var reader = new FileReader();

	reader.onload = function() {
		audioElement[ currAudio ].src = reader.result;
		audioElement[ currAudio ].dataset.artist = '';
		audioElement[ currAudio ].dataset.title = '';
		audioElement[ currAudio ].dataset.codec = '';
		audioElement[ currAudio ].play();
	};

	reader.readAsDataURL( obj.files[0] );
}

/**
 * Load a configuration preset
 */
function loadPreset( name ) {

	if ( ! presets[ name ] ) // check invalid preset name
		return;

	if ( presets[ name ].hasOwnProperty( 'mode' ) )
		elMode.value = presets[ name ].mode;

	if ( presets[ name ].hasOwnProperty( 'fftSize' ) )
		elFFTsize.value = presets[ name ].fftSize;

	if ( presets[ name ].hasOwnProperty( 'freqMin' ) )
		elRangeMin.value = presets[ name ].freqMin;

	if ( presets[ name ].hasOwnProperty( 'freqMax' ) )
		elRangeMax.value = presets[ name ].freqMax;

	if ( presets[ name ].hasOwnProperty( 'smoothing' ) )
		elSmoothing.value = presets[ name ].smoothing;

	if ( presets[ name ].hasOwnProperty( 'showScale' ) )
		elShowScale.dataset.active = Number( presets[ name ].showScale );

	if ( presets[ name ].hasOwnProperty( 'highSens' ) )
		elHighSens.dataset.active = Number( presets[ name ].highSens );

	if ( presets[ name ].hasOwnProperty( 'showPeaks' ) )
		elShowPeaks.dataset.active = Number( presets[ name ].showPeaks );

	if ( presets[ name ].hasOwnProperty( 'blackBg' ) )
		elBlackBg.dataset.active = Number( presets[ name ].blackBg );

	if ( presets[ name ].hasOwnProperty( 'cycleGrad' ) )
		elCycleGrad.dataset.active = Number( presets[ name ].cycleGrad );

	if ( presets[ name ].hasOwnProperty( 'ledDisplay' ) )
		elLedDisplay.dataset.active = Number( presets[ name ].ledDisplay );

	if ( presets[ name ].hasOwnProperty( 'repeat' ) )
		elRepeat.dataset.active = Number( presets[ name ].repeat );

	if ( presets[ name ].hasOwnProperty( 'showSong' ) )
		elShowSong.dataset.active = Number( presets[ name ].showSong );

	if ( presets[ name ].hasOwnProperty( 'noShadow' ) )
		elNoShadow.dataset.active = Number( presets[ name ].noShadow );

	if ( presets[ name ].hasOwnProperty( 'loRes' ) )
		elLoRes.dataset.active = Number( presets[ name ].loRes );

	setCanvas();

	if ( presets[ name ].hasOwnProperty( 'gradient' ) && gradients[ presets[ name ].gradient ] )
		elGradient.value = presets[ name ].gradient;

	setFFTsize();
	setSmoothing();
	setSensitivity();
	setShowPeaks();
	setBlackBg();
}

/**
 * Save / update a configuration
 */
function saveConfig( config ) {

	var settings = {
		fftSize		: elFFTsize.value,
		freqMin		: elRangeMin.value,
		freqMax		: elRangeMax.value,
		smoothing	: analyzer.smoothingTimeConstant,
		gradient	: elGradient.value,
		mode        : elMode.value,
		showScale 	: elShowScale.dataset.active == '1',
		highSens	: elHighSens.dataset.active == '1',
		showPeaks 	: elShowPeaks.dataset.active == '1',
		blackBg     : elBlackBg.dataset.active == '1',
		cycleGrad   : elCycleGrad.dataset.active == '1',
		ledDisplay  : elLedDisplay.dataset.active == '1',
		repeat      : elRepeat.dataset.active == '1',
		showSong    : elShowSong.dataset.active == '1',
		noShadow    : elNoShadow.dataset.active == '1',
		loRes       : elLoRes.dataset.active == '1'
	};

	localStorage.setItem( config, JSON.stringify( settings ) );
}

/**
 * Update last used configuration
 */
function updateLastConfig() {
	saveConfig( 'last-config' );
}

/**
 * Update custom preset
 */
function updateCustomPreset() {
	saveConfig( 'custom-preset' );
	document.getElementById('preset').value = 'custom';
}

/**
 * Process keyboard shortcuts
 */
function keyboardControls( event ) {

	if ( ! audioStarted )
		initAudio();

//	if ( event.target.tagName.toLowerCase() != 'body' && event.target.className != 'fullscreen-button' )
//		return;

	var gradIdx = elGradient.selectedIndex,
		modeIdx = elMode.selectedIndex;

	switch ( event.code ) {
		case 'Delete': 		// delete selected songs from the playlist
			playlist.querySelectorAll('.selected').forEach( e => {
				e.remove();
			});
			var current = getIndex( playlist.querySelector('.current') );
			if ( current !== undefined )
				playlistPos = current;	// update playlistPos if current song hasn't been deleted
			else if ( playlistPos > playlist.children.length - 1 )
				playlistPos = playlist.children.length - 1;
			else
				playlistPos--;
			loadNextSong();
			break;
		case 'Space': 		// play / pause
			setCanvasMsg( isPlaying() ? 'Pause' : 'Play' );
			playPause();
			break;
		case 'ArrowLeft': 	// previous song
		case 'KeyJ':
			setCanvasMsg( 'Previous song' );
			playPreviousSong();
			break;
		case 'ArrowUp': 	// gradient
		case 'ArrowDown':
		case 'KeyG':
			if ( event.code == 'ArrowUp' || ( event.code == 'KeyG' && event.shiftKey ) ) {
				if ( gradIdx == 0 )
					elGradient.selectedIndex = elGradient.options.length - 1;
				else
					elGradient.selectedIndex = gradIdx - 1;
			}
			else {
				if ( gradIdx == elGradient.options.length - 1 )
					elGradient.selectedIndex = 0;
				else
					elGradient.selectedIndex = gradIdx + 1;
			}
			setCanvasMsg( 'Gradient: ' + gradients[ elGradient.value ].name );
			break;
		case 'ArrowRight': 	// next song
		case 'KeyK':
			setCanvasMsg( 'Next song' );
			playNextSong();
			break;
		case 'KeyA': 		// toggle auto gradient change
			elCycleGrad.click();
			setCanvasMsg( 'Auto gradient ' + ( elCycleGrad.dataset.active == '1' ? 'ON' : 'OFF' ) );
			break;
		case 'KeyB': 		// toggle black background
			elBlackBg.click();
			setCanvasMsg( 'Background ' + ( elBlackBg.dataset.active == '1' ? 'OFF' : 'ON' ) );
			break;
		case 'KeyD': 		// display information
			if ( canvasMsg.msg ) {
				if ( canvasMsg.msg == 'all' )
					setCanvasMsg();
				else
					setCanvasMsg( 'all', 300 );
			}
			else
				setCanvasMsg( 'song', 300 );
			break;
		case 'KeyF': 		// toggle fullscreen
			fullscreen();
			break;
		case 'KeyI': 		// toggle info display on track change
			elShowSong.click();
			setCanvasMsg( 'Song info display ' + ( elShowSong.dataset.active == '1' ? 'ON' : 'OFF' ) );
			break;
		case 'KeyL': 		// toggle LED display effect
			elLedDisplay.click();
			setCanvasMsg( 'LED effect ' + ( elLedDisplay.dataset.active == '1' ? 'ON' : 'OFF' ) );
			break;
		case 'KeyM': 		// visualization mode
		case 'KeyV':
			if ( event.shiftKey ) {
				if ( modeIdx == 0 )
					elMode.selectedIndex = elMode.options.length - 1;
				else
					elMode.selectedIndex = modeIdx - 1;
			}
			else {
				if ( modeIdx == elMode.options.length - 1 )
					elMode.selectedIndex = 0;
				else
					elMode.selectedIndex = modeIdx + 1;
			}
			setScale();
			setCanvasMsg( 'Mode: ' + elMode[ elMode.selectedIndex ].text );
			break;
		case 'KeyN': 		// toggle sensitivity
			elHighSens.click();
			setCanvasMsg( ( elHighSens.dataset.active == '1' ? 'HIGH' : 'LOW' ) + ' sensitivity' );
			break;
		case 'KeyO': 		// toggle resolution
			elLoRes.click();
			setCanvasMsg( ( elLoRes.dataset.active == '1' ? 'LOW' : 'HIGH' ) + ' Resolution' );
			break;
		case 'KeyP': 		// toggle peaks display
			elShowPeaks.click();
			setCanvasMsg( 'Peaks ' + ( elShowPeaks.dataset.active == '1' ? 'ON' : 'OFF' ) );
			break;
		case 'KeyR': 		// toggle playlist repeat
			elRepeat.click();
			setCanvasMsg( 'Playlist repeat ' + ( elRepeat.dataset.active == '1' ? 'ON' : 'OFF' ) );
			break;
		case 'KeyS': 		// toggle scale
			elShowScale.click();
			setCanvasMsg( 'Scale ' + ( elShowScale.dataset.active == '1' ? 'ON' : 'OFF' ) );
			break;
		case 'KeyT': 		// toggle text shadow
			elNoShadow.click();
			setCanvasMsg( ( elNoShadow.dataset.active == '1' ? 'Flat' : 'Shadowed' ) + ' text mode' );
			break;
		case 'KeyU': 		// shuffle playlist
			if ( playlist.length > 0 ) {
				shufflePlaylist();
				setCanvasMsg( 'Shuffled playlist' );
			}
			break;
	}
}


/**
 * Event handler for 'play' on audio elements
 */
function audioOnPlay( event ) {
	if ( audioStarted ) {
		if ( audioElement[ currAudio ].src == '' ) {
			if ( playlist.children.length == 0 ) {
				consoleLog( 'No song loaded', true );
				audioElement[ currAudio ].pause();
			}
			else
				playSong( playlistPos );
		}
		else if ( elShowSong.dataset.active == '1' )
			setCanvasMsg( 'song', 600, 180 );
	}
	else {
		event.target.pause();
		if ( event.target.id == 'player1' ) {
			audioStarted = true;
			consoleLog( 'Started audio elements' );
		}
	}
}

/**
 * Event handler for 'ended' on audio elements
 */
function audioOnEnded() {
	// song ended, skip to next one if available
	if ( playlistPos < playlist.children.length - 1 || elRepeat.dataset.active == '1' )
		playNextSong( true );
	else
		loadSong( 0 );
}

/**
 * Error event handler for audio elements
 */
function audioOnError( e ) {
	consoleLog( 'Error loading ' + e.target.src, true );
}

/**
 * Set canvas dimensions
 */
function setCanvas() {
	pixelRatio = window.devicePixelRatio; // for Retina / HiDPI devices

	if ( elLoRes.dataset.active == '1' )
		pixelRatio /= 2;

	// Adjust canvas width and height to match the display's resolution
	canvas.width = window.screen.width * pixelRatio;
	canvas.height = window.screen.height * pixelRatio;

	// always consider landscape orientation
	if ( canvas.height > canvas.width ) {
		var tmp = canvas.width;
		canvas.width = canvas.height;
		canvas.height = tmp;
	}
	consoleLog( 'Canvas size is ' + canvas.width + 'x' + canvas.height + ' pixels (dPR: ' + pixelRatio + ')' );

	if ( pixelRatio == 2 && canvas.height <= 1080 ) // adjustment for wrong dPR reported on Shield TV
		pixelRatio = 1;

	canvasCtx.lineWidth = 4 * pixelRatio;
	canvasCtx.lineJoin = 'round';

	// Generate gradients

	var grad, i;

	Object.keys( gradients ).forEach( function( key ) {
		grad = canvasCtx.createLinearGradient( 0, 0, 0, canvas.height );
		if ( gradients[ key ].hasOwnProperty( 'colorStops' ) ) {
			for ( i = 0; i < gradients[ key ].colorStops.length; i++ )
				grad.addColorStop( gradients[ key ].colorStops[ i ].stop, gradients[ key ].colorStops[ i ].color );
		}
		// rainbow gradients are easily created iterating over the hue value
		else if ( key == 'prism' ) {
			for ( i = 0; i <= 240; i += 60 )
				grad.addColorStop( i/240, 'hsl( ' + i + ', 100%, 50% )' );
		}
		else if ( key == 'rainbow' ) {
			grad = canvasCtx.createLinearGradient( 0, 0, canvas.width, 0 ); // this one is a horizontal gradient
			for ( i = 0; i <= 360; i += 60 )
				grad.addColorStop( i/360, 'hsl( ' + i + ', 100%, 50% )' );
		}

		// add the option to the html select element for the user interface
		if ( elGradient.options.length < Object.keys( gradients ).length )
			elGradient.options[ elGradient.options.length ] = new Option( gradients[ key ].name, key );

		// save the actual gradient back into the gradients array
		gradients[ key ].gradient = grad;
	});

	preCalcPosX();
	updateLastConfig();
}


/**
 * Initialization
 */
function initialize() {

	consoleLog( 'audioMotion.js version ' + _VERSION );
	consoleLog( 'Initializing...' );

	// Initialize playlist and set event listeners
	playlist = document.getElementById('playlist');
	playlist.addEventListener( 'click', function ( e ) {
		if ( e.target ) {
			var classes = e.target.className;
			if ( ! e.ctrlKey ) // Ctrl key allows multiple selections
				playlist.querySelectorAll('.selected').forEach( n => n.className = n.className.replace( 'selected', '' ) );
			if ( classes.indexOf('selected') == -1 )
				e.target.className = classes + ' selected';
			else
				e.target.className = classes.replace( 'selected', '' );
		}
	});
	playlist.addEventListener( 'dblclick', function ( e ) {
		if ( e.target && e.target.dataset.file )
			playSong( getIndex( e.target ) );
	});
	playlistPos = 0;

	// Add event listeners for config panel selectors
	document.getElementById('panel_selector').addEventListener( 'click', function ( event ) {
		document.querySelectorAll('#panel_selector li').forEach( e => {
			e.className = '';
			document.getElementById( e.dataset.panel ).style.display = 'none';
		});
		let el = document.getElementById( event.target.dataset.panel || event.target.parentElement.dataset.panel );
//			el.style.display = ( el.offsetWidth > 0 && el.offsetHeight > 0 ) ? 'none' : 'block';
		el.style.display = 'block';
		if ( event.target.nodeName == 'LI' )
			event.target.className = 'active';
		else
			event.target.parentElement.className = 'active';
	});
	document.getElementById('show_filelist').click();

	// Create audio context

	var AudioContext = window.AudioContext || window.webkitAudioContext;

	try {
		audioCtx = new AudioContext();
	}
	catch( err ) {
		consoleLog( 'Could not create audio context. Web Audio API not supported?', true );
		consoleLog( 'Aborting.', true );
		return false;
	}

	consoleLog( 'Audio context sample rate is ' + audioCtx.sampleRate + 'Hz' );

	// Create audio elements

	audioElement = [
		document.getElementById('player0'),
		document.getElementById('player1')
	];

	currAudio = 0;
	nextAudio = 1;

	audioElement[0].style.display = 'block';
	audioElement[1].style.display = 'none';

	audioElement[0].addEventListener( 'play', audioOnPlay );
	audioElement[1].addEventListener( 'play', audioOnPlay );

//	audioElement[0].addEventListener( 'ended', audioOnEnded );
//	audioElement[1].addEventListener( 'ended', audioOnEnded );

	audioElement[0].addEventListener( 'error', audioOnError );
	audioElement[1].addEventListener( 'error', audioOnError );

	analyzer = audioCtx.createAnalyser();
	sourcePlayer = [
		audioCtx.createMediaElementSource( audioElement[0] ),
		audioCtx.createMediaElementSource( audioElement[1] )
	];

	sourcePlayer[0].connect( analyzer );
	sourcePlayer[1].connect( analyzer );
	analyzer.connect( audioCtx.destination );

	// Set UI elements

	elFFTsize   = document.getElementById('fft_size');
	elRangeMin  = document.getElementById('freq_min');
	elRangeMax  = document.getElementById('freq_max');
	elSmoothing = document.getElementById('smoothing');
	elMode      = document.getElementById('mode');
	elGradient  = document.getElementById('gradient');
	elShowScale = document.getElementById('show_scale');
	elHighSens  = document.getElementById('sensitivity');
	elShowPeaks = document.getElementById('show_peaks');
	elBlackBg   = document.getElementById('black_bg');
	elCycleGrad = document.getElementById('cycle_grad');
	elLedDisplay= document.getElementById('led_display');
	elRepeat    = document.getElementById('repeat');
	elShowSong  = document.getElementById('show_song');
	elNoShadow  = document.getElementById('no_shadow');
	elLoRes     = document.getElementById('lo_res');

	// Add event listeners to the custom checkboxes
	var switches = document.querySelectorAll('.switch');
	for ( let i = 0; i < switches.length; i++ ) {
		switches[ i ].addEventListener( 'click', function( e ) {
			if ( e.target.className.match( /switch/ ) ) // check for clicks on child nodes
				e.target.dataset.active = Number( ! Number( e.target.dataset.active ) );
			else
				e.target.parentElement.dataset.active = Number( ! Number( e.target.parentElement.dataset.active ) );
		});
	}

	elShowScale. addEventListener( 'click', setScale );
	elHighSens.  addEventListener( 'click', setSensitivity );
	elShowPeaks. addEventListener( 'click', setShowPeaks );
	elBlackBg.   addEventListener( 'click', setBlackBg );
	elCycleGrad. addEventListener( 'click', updateLastConfig );
	elLedDisplay.addEventListener( 'click', setScale );
	elRepeat.    addEventListener( 'click', updateLastConfig );
	elShowSong.  addEventListener( 'click', updateLastConfig );
	elNoShadow.  addEventListener( 'click', updateLastConfig );
	elLoRes.     addEventListener( 'click', setCanvas );

	// Canvas

	canvas = document.getElementById('canvas');
	canvasCtx = canvas.getContext('2d');
	setCanvasMsg();

	// clicks on canvas also toggle scale on/off
	canvas.addEventListener( 'click', function() {
		elShowScale.click();
	});

	// Load / initialize configuration options

	var settings;

	settings = localStorage.getItem( 'last-config' );
	if ( settings !== null )
		presets['last'] = JSON.parse( settings );
	else // if no data found from last session, use the defaults
		presets['last'] = JSON.parse( JSON.stringify( presets['default'] ) );

	settings = localStorage.getItem( 'custom-preset' );
	if ( settings !== null )
		presets['custom'] = JSON.parse( settings );
	else
		presets['custom'] = JSON.parse( JSON.stringify( presets['last'] ) );

	loadPreset('last');

	// Set audio source to built-in player
	elSource = document.getElementById('source');
	setSource();

	// Load saved playlists
	elPlaylists = document.getElementById('playlists');
	loadSavedPlaylists();

	document.getElementById('load_playlist').addEventListener( 'click', function() {
		loadPlaylist( elPlaylists.value );
	})
	document.getElementById('save_playlist').addEventListener( 'click', function() {
		savePlaylist( elPlaylists.selectedIndex );
	})
	document.getElementById('create_playlist').addEventListener( 'click', function() {
		storePlaylist();
	})
	document.getElementById('delete_playlist').addEventListener( 'click', function() {
		deletePlaylist( elPlaylists.selectedIndex );
	})

	// Add event listener for keyboard controls
	window.addEventListener( 'keyup', keyboardControls );

	// On Webkit audio must be started on some user gesture
	window.addEventListener( 'click', initAudio );

	// Start canvas animation
	requestAnimationFrame( draw );
}


/**
 * Initialize when window finished loading
 */

window.addEventListener( 'load', initialize );
/*\
|*|
|*|	:: cookies.js ::
|*|
|*|	A complete cookies reader/writer framework with full unicode support.
|*|
|*|	Revision #7 - September 13th, 2019
|*|
|*|	https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|	https://developer.mozilla.org/User:fusionchess
|*|	https://github.com/madmurphy/cookies.js
|*|
|*|	This framework is released under the GNU Public License, version 3 or later.
|*|	http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|	Syntaxes:
|*|
|*|	* docCookies.setItem(name, value[, end[, path[, domain[, secure[, same-site]]]]])
|*|	* docCookies.getItem(name)
|*|	* docCookies.removeItem(name[, path[, domain[, secure[, same-site]]]])
|*|	* docCookies.hasItem(name)
|*|	* docCookies.keys()
|*|	* docCookies.clear([path[, domain[, secure[, same-site]]]])
|*|
\*/

(function (useSameSiteNone) {
	
	function makeSetterString (sKey, sValue, vEnd, sPath, sDomain, bSecure, vSameSite) {

		var sExpires = "";
		var sameSiteNone = useSameSiteNone ? "; samesite=none" : "";

		if (vEnd) {

			switch (vEnd.constructor) {

				case Number:

					/*
					Note: Despite officially defined in RFC 6265, the use of `max-age` is not compatible with any
					version of Internet Explorer, Edge and some mobile browsers. Therefore passing a number to
					the end parameter might not work as expected. A possible solution might be to convert the the
					relative time to an absolute time. For instance, replacing the following line with:
					*/
					/*
					sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; expires=" + (new Date(vEnd * 1e3 + Date.now())).toUTCString();
					*/

					sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
					break;

				case String:

					sExpires = "; expires=" + vEnd;
					break;

				case Date:

					sExpires = "; expires=" + vEnd.toUTCString();
					break;

			}

		}

		return	encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "") + (!vSameSite || vSameSite.toString().toLowerCase() === "no_restriction" || vSameSite < 0 ? sameSiteNone : vSameSite.toString().toLowerCase() === "lax" || Math.ceil(vSameSite) === 1 || vSameSite === true ? "; samesite=lax" : "; samesite=strict");

	}

	var reURIAllowed = /[\-\.\+\*]/g, reCNameAllowed = /^(?:expires|max\-age|path|domain|secure|samesite|httponly)$/i;

	window.docCookies = {

		"getItem": function (sKey) {

			if (!sKey) { return null; }

			return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(reURIAllowed, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;

		},

		"setItem": function (sKey, sValue, vEnd, sPath, sDomain, bSecure, vSameSite) {

			if (!sKey || reCNameAllowed.test(sKey)) { return false; }

			document.cookie = makeSetterString(sKey, sValue, vEnd, sPath, sDomain, bSecure, vSameSite);
			return true;

		},

		"removeItem": function (sKey, sPath, sDomain, bSecure, vSameSite) {

			if (!this.hasItem(sKey)) { return false; }

			document.cookie = makeSetterString(sKey, "", "Thu, 01 Jan 1970 00:00:00 GMT", sPath, sDomain, bSecure, vSameSite);
			return true;

		},

		"hasItem": function (sKey) {

			if (!sKey || reCNameAllowed.test(sKey)) { return false; }

			return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(reURIAllowed, "\\$&") + "\\s*\\=")).test(document.cookie);

		},

		"keys": function () {

			var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);

			for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {

				aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]);

			}

			return aKeys;
		},

		"clear": function (sPath, sDomain, bSecure, vSameSite) {

			for (var aKeys = this.keys(), nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) {

				this.removeItem(aKeys[nIdx], sPath, sDomain, bSecure, vSameSite);

			}

		}

	};

})((function () {
	return !isSameSiteNoneIncompatible ();

	function isSameSiteNoneIncompatible (useragent) {

		return hasWebKitSameSiteBug(useragent) || dropsUnrecognizedSameSiteCookies(useragent);

	}

	function hasWebKitSameSiteBug (useragent) {

		if (isIosVersion(useragent)) return true;

		if (!isMacosxVersion(10, 14, useragent)) return false;

		return isSafari(useragent) || isMacEmbeddedBrowser(useragent);

	}

	function dropsUnrecognizedSameSiteCookies (useragent) {

		if (isUcBrowser(useragent))

			return !isUcBrowserVersionAtLeast(12, 13, 2, useragent);

		return isChromiumBased(useragent) && isChromiumVersionAtLeast(51, useragent) && !isChromiumVersionAtLeast(67, useragent);

	}

	function isIosVersion (major, useragent) {

		var regex = /\(iP.+; CPU .*OS (\d+)[_\d]*.*\) AppleWebKit\//;

		return useragent.matches(regex)[0] == major;

	}

	function isMacosxVersion (major, minor, useragent) {

		var regex = /\(Macintosh;.*Mac OS X (\d+)_(\d+)[_\d]*.*\) AppleWebKit\//;

		var matches = useragent.matches(regex);

		return matches[0] == major && matches[1] == minor;

	}

	function isSafari (useragent) {

		var regex = /Version\/.* Safari\//

		return useragent.test(regex) && !isChromiumBased(useragent);

	}

	function isMacEmbeddedBrowser (useragent) {

		var regex = /^Mozilla\/[\.\d]+ \(Macintosh;.*Mac OS X [_\d]+\) AppleWebKit\/[\.\d]+ \(KHTML, like Gecko\)$/

		return useragent.test(regex);

	}

	function isChromiumBased (useragent) {

		var regex = /Chrom(e|ium)/;

		return useragent.test(regex);

	}

	function isChromiumVersionAtLeast (major, useragent) {

		var regex = /Chrom[^ \/]+\/(\d+)[\.\d]* /;

		var version = +useragent.matches(regex)[0];

		return version >= major;

	}

	function isUcBrowser (useragent) {

		var regex = /UCBrowser\//;

		return useragent.test(regex);

	}

	function isUcBrowserVersionAtLeast (major, minor, build, useragent) {

		var regex = /UCBrowser\/(\d+)\.(\d+)\.(\d+)[\.\d]*/;

		var matches = useragent.match(regex);

		// // Extract digits from three capturing groups.
		var majorVersion = +matches[0];
		var minorVersion = +matches[0];
		var buildVersion = +matches[0];

		if (majorVersion !== major) 

			return majorVersion > major;

		if (minorVersion != minor)

			return minorVersion > minor;

		return buildVersion >= build;

	}

	
})(window.navigator.userAgent));

if (typeof module !== "undefined" && typeof module.exports !== "undefined") {

	module.exports = docCookies;

}

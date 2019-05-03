'use strict';
const filenameReservedRegex = () => (/[<>:"\/\\|?*\x00-\x1F]/g);
filenameReservedRegex.windowsNames = () => (/^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i);

const validFilename = string => {
	if (!string || string.length > 255) {
		return false;
	}

	if (filenameReservedRegex().test(string) || filenameReservedRegex.windowsNames().test(string)) {
		return false;
	}

	if (/^\.\.?$/.test(string)) {
		return false;
	}

	return true;
};
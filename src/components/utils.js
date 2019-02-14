export function $(selector, all) {
	if (all)
		return document.querySelectorAll(selector);
	else
		return document.querySelector(selector);
}

HTMLElement.prototype.appendHTML = function(html, print) {
	if (print) console.log(html);
	[...new DOMParser().parseFromString(html, "text/html").body.children].forEach(i => {
		this.appendChild(i);
	});

	return this;
};
HTMLElement.prototype.on = HTMLElement.prototype.addEventListener;
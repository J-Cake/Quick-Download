class UIbox {
	constructor(template, name, onshow, onconfirm, oncancel) {
		if (!template) {
			throw new Error("template parameter is required");
		}
		this.template = template;
		this.name = name;
		this.onshow = onshow;
		this.onconfirm = onconfirm;
		this.oncancel = oncancel;
		this.template.parent = this;
		this.showing = false;
		this.template.setBtnBehavoiurs();
		this.self;
	}
	show(x, y) {
		if (!this.showing) {
			if (document.querySelector(".uibox.display_area") == null)
				document.body.appendHTML(`<div class="uibox display_area"></div>`);
			this.drawArea = document.querySelector(".uibox.display_area");
			this.drawArea.appendHTML(this.renderTemplate(this.template));
			this.self = [...this.drawArea.querySelectorAll('.uibox.wrapper')].pop();
			this.self.style.top = y + 'px' || 'auto';
			this.self.style.left = x + 'px' || 'auto';
			this.showing = true;
			this.addBtnListeners()
			// this.self.getFocus();
		} else {
			this.unrender();
			this.show(x, y);
		}
		if (this.onshow)
			this.onshow();
	}
	get() {
		this.show();
		return new Promise((res, rej) => {
			this.resolve = (function() {
				let parsedBodyContent = {};
				let body = [...this.self.querySelector('.content').children];
				body.forEach(element => {
					if (element instanceof HTMLInputElement) {
						parsedBodyContent[element.getAttribute('name')] = element.value;
					} else if (element.getAttribute('contenteditable') === 'true') {
						parsedBodyContent[element.getAttribute('name')] = element.innerHTML;
					}
				});
				[...this.self.querySelectorAll('.output')].forEach(element => {
					parsedBodyContent[element.getAttribute('name') || "info" + Object.keys(parsedBodyContent).length] = element.innerHTML.trim();
				});
				if (Object.keys(parsedBodyContent).length === 1) parsedBodyContent = parsedBodyContent[Object.keys(parsedBodyContent)[0]];
				res(parsedBodyContent);
			});
			this.reject = rej;
		});
	}
	renderTemplate(template) {
		let templateHTML;
		switch (template.type) {
			case 'box':
				templateHTML = `<br/><div class='uibox box wrapper' autofocus id='box${Math.floor(document.querySelector(".uibox.display_area").children.length / 2) + 1}'><span class='uibox box header'>${this.name}</span><div class='uibox box content'>`
				templateHTML += template.content + `</div><div class="uibox box buttons">`;
				template.buttons.forEach((button, index) => {
					templateHTML += `<button class='uibox button', id='btn${this.drawArea.querySelectorAll('.buttons button').length + index + 1}'>${button.text}</button>`;
				});
				break;
			case 'toast':
				templateHTML = `<br/><div class='uibox toast wrapper'>${template.content}</div>`;
				setTimeout(() => {
					this.unrender();
					try {
						this.onconfirm();
					} catch {
						null
					}
				}, template.settings.duration || 2000);
				break;
			case 'notification':
				templateHTML = `<div class='uibox notification wrapper'><div class='uibox notification message'>${template.content}</div><button class='uibox global close'></button></div>`;
				setTimeout(e => {
					this.unrender()
				}, template.settings.duration || 5000);
				break;
			case 'menu':
				templateHTML = `<div class='uibox menu wrapper'><ul class='uibox menu container'>`;
				let keys = Object.keys(this.template.content);
				keys.forEach(key => {
					templateHTML += key !== 'spacer' ? `<li class="uibox menu option"><span class='uibox menu option caption'>${key}</span></li>` : `<hr/>`;
				})
		}
		return templateHTML + `</div></div>`
	}
	addBtnListeners() {
		try {
			this.self.addEventListener('keypress', e => e.keyCode === 13 ? this.resolve(this.unrender()) : null); // make ESC close dialog
			let buttons = [...this.self.querySelector('.buttons').children];
			buttons.forEach((button, i) => {
				if (button) {
					button.addEventListener('click', e => {
						this.template.buttons[i].click();
						try {
							if (this.template.buttons[i].submitsForm) this.resolve();
							else this.reject();
						} catch (e) {
							null
						}
					}, false)
				}
			});
		} catch (e) {
			null
		}
		if (this.template.type === 'notification') {
			this.self.querySelector('.notification.message').addEventListener('click', e => {
				try {
					this.onconfirm()
				} catch {
					null
				}
				this.unrender();
			});
			this.self.querySelector('.global.close').addEventListener('click', e => {
				try {
					this.oncancel()
				} catch {
					null
				}
				this.unrender();
			})
		} else if (this.template.type === "menu") {
			[...this.self.querySelector('.uibox.menu').children].forEach((option, index) => {
				if (option.children.length !== 0) { // filter out HR elements
					option.addEventListener('click', e => {
						this.template.content[Object.keys(this.template.content)[index]]();
						this.unrender()
					})
				}
			})
		}
	}
	unrender() {
		if (this.showing) {
			this.self.outerHTML = "";
			this.showing = false;
		}
	}
}
class template {
	constructor(templateObj) {
		this.buttons = templateObj.buttons || [];
		this.content = templateObj.content;
		this.type = templateObj.type || "box";
		this.settings = templateObj.settings || [];
	}
	setBtnBehavoiurs() {
		this.buttons.forEach(btn => {
			btn.parent = this.parent;
			btn.setBehaviour();
		})
	}
}
class button {
	constructor(text, callback, closeDialog, submitsForm) {
		this.text = text;
		this.parent = {};
		this.callback = callback;
		this.unrender = this.parent.unrender;
		this.closeDialog = closeDialog;
		this.submitsForm = submitsForm || false;
	}
	setBehaviour() {
		if (typeof this.callback == "string") {
			switch (this.callback) {
				case 'ok':
					this.callback = (function() {
						this.submitsForm = true;
						this.closeDialog = true;
						this.parent.onconfirm();
					});
					break;
				case 'cancel':
					this.callback = (function() {
						this.submitsForm = false;
						this.closeDialog = true;
						this.parent.oncancel();
					});
					break;
			}
		}
	}
	click() {
		try {
			this.callback()
		} catch (e) {}
		if (this.closeDialog) this.parent.unrender();
	}
}
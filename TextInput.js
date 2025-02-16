/*:
 * @target MZ
 * @plugindesc v1.0.0 A feature-rich multi-line text input system for RPG Maker MZ
 * @author Reishandy
 * 
 * @param InputWidth
 * @type number
 * @min 10
 * @max 100
 * @text Input Width (%)
 * @desc Percentage of the screen width for the text input box.
 * @default 70
 *
 * @param InputHeight
 * @type number
 * @min 10
 * @max 100
 * @text Input Height (%)
 * @desc Percentage of the screen height for the text input box.
 * @default 50
 *
 * @help
 * TextInput.js - Version 1.0.0
 * ==========================================================================
 * 
 * Description:
 * This plugin provides a versatile multi-line text input system that works
 * on both desktop and mobile devices.
 * 
 * Features:
 * - Multi-line text input with customizable maximum lines
 * - Custom label text above the input field
 * - RPG Maker styled OK button for confirmation
 * - Mobile-friendly with proper keyboard support
 * - Cursor navigation using arrow keys or touch
 * - Backspace and character deletion support
 * - Proper focus handling
 * - Variable storage for input text
 * 
 * Plugin Command:
 * OpenTextInput
 * Parameters:
 *   - Variable ID: The game variable to store the input text
 *   - Label Text: The text shown above the input box
 *   - Max Lines: Maximum number of lines allowed (1-100)
 * 
 * Usage Example in Event:
 * =====================
 * 1. Add a "Plugin Command" to your event
 * 2. Select "TextInput" -> "OpenTextInput"
 * 3. Set parameters:
 *    - Variable ID: Choose the variable to store the text
 *    - Label: "Enter your message:"
 *    - Max Lines: 5
 * 
 * The entered text will be stored in the selected game variable.
 * 
 * Technical Notes:
 * - Uses password type input to prevent mobile suggestions, this is a limitation. 
 *   if it uses text type, or textarea the keyboard will have a buffer. 
 *   so when you press backspace it will not instantly delete the character. you need to press it the entire word or sentence.
 * - Handles escaped characters properly
 * - Supports both mouse/touch and keyboard input
 * 
 * Compatibility:
 * - RPG Maker MZ
 * - Works with both desktop and mobile browsers
 * 
 * Terms of Use:
 * Free for both commercial and non-commercial projects.
 * Credit is appreciated but not required.
 * 
 * ==========================================================================
 * 
 * @command OpenTextInput
 * @text Open Text Input
 * @desc Opens a text input box and stores the result in a variable.
 *
 * @arg variableId
 * @type variable
 * @text Variable ID
 * @desc The variable that will store the input text.
 *
 * @arg label
 * @type string
 * @text Label Text
 * @desc The label displayed above the input box.
 * @default Enter text:
 *
 * @arg maxLines
 * @type number
 * @text Max Lines
 * @desc Maximum number of lines allowed. Default is 10 if left empty.
 * @min 1
 * @max 100
 * @default 10
 */

(() => {
    const pluginName = "TextInput";
    const params = PluginManager.parameters(pluginName);
    const INPUT_WIDTH_PERCENT = Number(params["InputWidth"]) / 100;
    const INPUT_HEIGHT_PERCENT = Number(params["InputHeight"]) / 100;
    const DEFAULT_MAX_LINES = Number(params["DefaultMaxLines"] || 10);

    PluginManager.registerCommand(pluginName, "OpenTextInput", (args) => {
        const variableId = Number(args.variableId);
        const label = args.label || "Enter text:";
        const maxLines = args.maxLines
            ? Number(args.maxLines)
            : DEFAULT_MAX_LINES;
        SceneManager.push(Scene_TextInput);
        SceneManager.prepareNextScene(variableId, label, maxLines);
    });

    class Scene_TextInput extends Scene_MenuBase {
        prepare(variableId, label, maxLines) {
            this._variableId = variableId;
            this._label = label;
            this._maxLines = maxLines;
        }

        create() {
            super.create();
            this.createWindowLayer();
            this.calculateWindowPositions();
            this.createLabelWindow();
            this.createInputWindow();
            this.createOkButton();
        }

        calculateWindowPositions() {
            const labelHeight = Graphics.boxHeight * 0.12;
            const inputHeight = Graphics.boxHeight * INPUT_HEIGHT_PERCENT;
            const buttonHeight = Graphics.boxHeight * 0.13;
            const totalHeight = labelHeight + inputHeight + buttonHeight + 20; // 20 for padding
            const startY = (Graphics.boxHeight - totalHeight) / 2;

            this._positions = {
                labelY: startY,
                inputY: startY + labelHeight + 10,
                buttonY: startY + labelHeight + inputHeight + 20,
            };
        }

        createLabelWindow() {
            const width = Graphics.boxWidth * INPUT_WIDTH_PERCENT;
            const height = Graphics.boxHeight * 0.12;
            const x = (Graphics.boxWidth - width) / 2;

            this._labelWindow = new Window_Base(
                new Rectangle(x, this._positions.labelY, width, height)
            );
            this._labelWindow.drawText(this._label, 0, 0, width, "center");
            this.addWindow(this._labelWindow);
        }

        createInputWindow() {
            const width = Graphics.boxWidth * INPUT_WIDTH_PERCENT;
            const height = Graphics.boxHeight * INPUT_HEIGHT_PERCENT;
            const x = (Graphics.boxWidth - width) / 2;

            this._inputWindow = new Window_TextInput(
                x,
                this._positions.inputY,
                width,
                height,
                this._maxLines
            );
            this.addWindow(this._inputWindow);
        }

        createOkButton() {
            const width = Graphics.boxWidth * 0.2;
            const height = Graphics.boxHeight * 0.13;
            const x = (Graphics.boxWidth - width) / 2;

            this._okButton = new Window_OkButton(
                x,
                this._positions.buttonY,
                width,
                height
            );
            this._okButton.setHandler("ok", this.onInputOk.bind(this));
            this.addWindow(this._okButton);
        }

        onInputOk() {
            const text = this._inputWindow.inputText();
            $gameVariables.setValue(this._variableId, text);
            this.popScene();
        }

        terminate() {
            super.terminate();
            if (this._inputWindow) {
                this._inputWindow.destroy();
            }
        }
    }

    class Window_TextInput extends Window_Base {
        initialize(x, y, width, height, maxLines) {
            super.initialize(new Rectangle(x, y, width, height));
            this._maxLines = maxLines;
            this._text = "";
            this._lines = [""];
            this._cursorVisible = true;
            this._blinkTimer = 0;
            this._cursorX = 0;
            this._cursorY = 0;
            this.refresh();
            this.activate();
            this.createHtmlInput();
        }

        refresh() {
            this.contents.clear();
            this.drawText();
            this.drawCursor();
        }

        drawText() {
            const maxVisibleLines = Math.floor(
                (this.height - this.padding * 2) / this.lineHeight()
            );
            const startLine = Math.max(0, this._lines.length - maxVisibleLines);

            for (
                let i = 0;
                i < Math.min(maxVisibleLines, this._lines.length);
                i++
            ) {
                const lineIndex = startLine + i;
                if (this._lines[lineIndex]) {
                    this.drawTextEx(
                        this._lines[lineIndex],
                        this.padding,
                        this.padding + i * this.lineHeight()
                    );
                }
            }
        }

        update() {
            super.update();
            this._blinkTimer++;
            if (this._blinkTimer >= 30) {
                this._cursorVisible = !this._cursorVisible;
                this._blinkTimer = 0;
                this.refresh();
            }
            this.updateTouch();
        }

        updateTouch() {
            if (TouchInput.isTriggered() && this.isTouchedInsideInput()) {
                const touchX = TouchInput.x - this.x - this.padding;
                const touchY = TouchInput.y - this.y - this.padding;
                this.moveCursorToTouch(touchX, touchY);
                this.focusInput();
            }
        }

        isTouchedInsideInput() {
            const x = TouchInput.x;
            const y = TouchInput.y;
            return (
                x >= this.x &&
                x < this.x + this.width &&
                y >= this.y &&
                y < this.y + this.height
            );
        }

        moveCursorToTouch(x, y) {
            const lineHeight = this.lineHeight();
            const touchedLine = Math.floor(y / lineHeight);
            if (touchedLine < this._lines.length) {
                this._cursorY = touchedLine;
                // Find closest character position
                const line = this._lines[this._cursorY];
                let bestPos = 0;
                let bestDiff = Number.MAX_VALUE;
                for (let i = 0; i <= line.length; i++) {
                    const textWidth = this.textWidth(line.substring(0, i));
                    const diff = Math.abs(textWidth - x);
                    if (diff < bestDiff) {
                        bestDiff = diff;
                        bestPos = i;
                    }
                }
                this._cursorX = bestPos;
                this.refresh();
            }
        }

        handleKeyDown(event) {
            switch (event.key) {
                case "ArrowLeft":
                    this.moveCursorLeft();
                    break;
                case "ArrowRight":
                    this.moveCursorRight();
                    break;
                case "ArrowUp":
                    this.moveCursorUp();
                    break;
                case "ArrowDown":
                    this.moveCursorDown();
                    break;
                case "Backspace":
                    this.processBackspace();
                    break;
                case "Enter":
                    this.processNewLine();
                    break;
                default:
                    if (event.key.length === 1) {
                        // Let the input event handle character input
                        return;
                    }
                    break;
            }
            event.preventDefault();
            this.refresh();
        }

        moveCursorLeft() {
            if (this._cursorX > 0) {
                this._cursorX--;
            } else if (this._cursorY > 0) {
                this._cursorY--;
                this._cursorX = this._lines[this._cursorY].length;
            }
        }

        moveCursorRight() {
            if (this._cursorX < this._lines[this._cursorY].length) {
                this._cursorX++;
            } else if (this._cursorY < this._lines.length - 1) {
                this._cursorY++;
                this._cursorX = 0;
            }
        }

        moveCursorUp() {
            if (this._cursorY > 0) {
                this._cursorY--;
                this._cursorX = Math.min(
                    this._cursorX,
                    this._lines[this._cursorY].length
                );
            }
        }

        moveCursorDown() {
            if (this._cursorY < this._lines.length - 1) {
                this._cursorY++;
                this._cursorX = Math.min(
                    this._cursorX,
                    this._lines[this._cursorY].length
                );
            }
        }

        processChar(char) {
            const line = this._lines[this._cursorY];
            if (line.length < this.contentsWidth() / 10) {
                // If character is a backslash, escape it for display
                const processedChar = char === "\\" ? "\\\\" : char;
                this._lines[this._cursorY] =
                    line.slice(0, this._cursorX) +
                    processedChar +
                    line.slice(this._cursorX);
                this._cursorX += processedChar.length; // Move cursor by actual inserted length
            }
        }

        processBackspace() {
            const line = this._lines[this._cursorY];
            if (this._cursorX > 0) {
                // Check if we're positioned after an escaped backslash
                const prevChars = line.slice(this._cursorX - 2, this._cursorX);
                if (prevChars === "\\\\") {
                    // Delete both characters of the escaped backslash
                    this._lines[this._cursorY] =
                        line.slice(0, this._cursorX - 2) +
                        line.slice(this._cursorX);
                    this._cursorX -= 2;
                } else {
                    // Normal single character deletion
                    this._lines[this._cursorY] =
                        line.slice(0, this._cursorX - 1) +
                        line.slice(this._cursorX);
                    this._cursorX--;
                }
            } else if (this._cursorY > 0) {
                const previousLine = this._lines[this._cursorY - 1];
                this._cursorX = previousLine.length;
                this._lines[this._cursorY - 1] = previousLine + line;
                this._lines.splice(this._cursorY, 1);
                this._cursorY--;
            }
            this.refresh();
        }

        processNewLine() {
            if (this._lines.length >= this._maxLines) {
                // Don't add new line if at max
                return;
            }

            const line = this._lines[this._cursorY];
            const beforeCursor = line.slice(0, this._cursorX);
            const afterCursor = line.slice(this._cursorX);
            this._lines[this._cursorY] = beforeCursor;
            this._lines.splice(this._cursorY + 1, 0, afterCursor);
            this._cursorY++;
            this._cursorX = 0;
            this.refresh();
        }

        drawCursor() {
            if (this._cursorVisible) {
                const maxVisibleLines = Math.floor(
                    (this.height - this.padding * 2) / this.lineHeight()
                );
                const startLine = Math.max(
                    0,
                    this._lines.length - maxVisibleLines
                );
                const visibleLine = this._cursorY - startLine;

                const line = this._lines[this._cursorY];
                const cursorX =
                    this.padding +
                    this.textWidth(line.substring(0, this._cursorX));
                const cursorY = this.padding + visibleLine * this.lineHeight();

                this.contents.fillRect(
                    cursorX,
                    cursorY + this.lineHeight() - 2,
                    10,
                    2,
                    ColorManager.normalColor()
                );
            }
        }

        createHtmlInput() {
            this._inputElement = document.createElement("input");
            this._inputElement.type = "password"; // To allow instant backspace on mobile, because type="text" triggers suggestions
            this._inputElement.style.position = "absolute";
            this._inputElement.style.opacity = "0";
            this._inputElement.style.left = "0";
            this._inputElement.style.top = "0";
            this._inputElement.style.width = "1px";
            this._inputElement.style.height = "1px";

            // Disable all suggestions and corrections
            this._inputElement.setAttribute("suggestions", "off");
            this._inputElement.setAttribute("spellcheck", "false");
            this._inputElement.setAttribute("autocomplete", "off");
            this._inputElement.setAttribute("autocorrect", "off");
            this._inputElement.setAttribute("autocapitalize", "off");

            document.body.appendChild(this._inputElement);

            // Event listeners
            this._inputElement.addEventListener(
                "input",
                this.onInputChange.bind(this)
            );
            this._inputElement.addEventListener(
                "keydown",
                this.handleKeyDown.bind(this)
            );

            this.focusInput();
        }

        focusInput() {
            if (this._inputElement) {
                this._inputElement.value = ""; // Clear any existing value
                this._inputElement.focus();

                // Force mobile keyboard to show
                if (Utils.isMobileDevice()) {
                    this._inputElement.readOnly = false;
                    this._inputElement.blur();
                    setTimeout(() => {
                        this._inputElement.focus();
                    }, 100);
                }
            }
        }

        onInputChange(event) {
            const value = event.target.value;
            if (value) {
                if (value === "\n") {
                    this.processNewLine();
                } else {
                    // Process each character
                    for (const char of value) {
                        this.processChar(char);
                    }
                }
                // Clear the textarea
                this._inputElement.value = "";
                this.refresh();
            }
        }

        destroy() {
            if (this._inputElement) {
                this._inputElement.removeEventListener(
                    "input",
                    this.onInputChange.bind(this)
                );
                window.removeEventListener(
                    "keydown",
                    this.handleKeyDown.bind(this)
                );
                document.body.removeChild(this._inputElement);
                this._inputElement = null;
            }
            super.destroy();
        }

        inputText() {
            return this._lines.join("\n");
        }
    }

    class Window_OkButton extends Window_Command {
        constructor(x, y, width, height) {
            super(new Rectangle(x, y, width, height));
            this.refresh();
        }

        makeCommandList() {
            this.addCommand("✓", "ok");
        }

        update() {
            super.update();
            // Only process touch input (ignore keyboard)
            if (this.active && TouchInput.isTriggered()) {
                if (this.isTouchedInside(TouchInput.x, TouchInput.y)) {
                    this.callOkHandler();
                }
            }
        }

        isTouchedInside(x, y) {
            return (
                x >= this.x &&
                x < this.x + this.width &&
                y >= this.y &&
                y < this.y + this.height
            );
        }

        // Override to disable keyboard handling.
        processHandling() {
            // Do nothing here so that keyboard input does not trigger the button.
        }
    }
})();

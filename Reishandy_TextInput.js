/*:
 * @target MZ
 * @plugindesc v1.0.3 A simple multi-line text input system for RPG Maker MZ
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
 * Reishandy_TextInput.js - Version 1.0.3
 * =======================================================================
 *
 * Description:
 * This plugin provides a multi-line text input system that works on both
 * desktop and mobile devices.
 *
 * Features:
 * - Multi-line text input with customizable maximum lines
 * - Custom label text above the input field
 * - Using RPG Maker's Windows system for style consistency
 * - Mobile-friendly with proper keyboard support
 * - Cursor navigation using arrow keys or touch
 * - Variable storage for input text
 *
 * Plugin Commands:
 * ----------------
 * 1. OpenTextInput
 *    - Opens a text input box and stores the result in a variable.
 *    - Parameters:
 *      - Variable ID: The game variable to store the input text
 *      - Label Text: The text shown above the input box
 *      - Max Lines: Maximum number of lines allowed (1-100)
 *    - Note: If the text input is empty, it returns the number 0 so that it can be used in conditional branches.
 *
 * 2. SetTextVariable
 *    - Sets the value of a game variable to a specific text.
 *    - Parameters:
 *      - Variable ID: The variable that will store the text.
 *      - Text: The text to store in the variable.
 *
 * Usage Example in Event:
 * =====================
 * 1. Add a "Plugin Command" to your event
 * 2. Select "Reishandy_TextInput" -> "OpenTextInput"
 * 3. Set parameters:
 *    - Variable ID: Choose the variable to store the text
 *    - Label: "Enter your message:"
 *    - Max Lines: 5
 *
 * The entered text will be stored in the selected game variable.
 *
 * Technical Notes:
 * - The text input is handled using an HTML input element
 * - The input element is hidden and positioned off-screen
 * - The text input is processed in real-time and displayed in the window
 * - It is not very optimized
 *
 * Compatibility:
 * - RPG Maker MZ
 * - Works with both desktop and mobile browsers
 *
 * Terms of Use:
 * Free for both commercial and non-commercial projects.
 * Credit is appreciated but not required.
 * =======================================================================
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
 *
 * @command SetTextVariable
 * @text Set Text Variable
 * @desc Sets the value of a game variable to a specific text.
 *
 * @arg variableId
 * @type variable
 * @text Variable ID
 * @desc The variable that will store the text.
 *
 * @arg text
 * @type string
 * @text Text
 * @desc The text to store in the variable.
 * @default 
 */

(() => {
    "use strict";

    //-------------------------------------------------------------------------
    // Plugin Parameters
    //-------------------------------------------------------------------------

    const PLUGIN_NAME = "Reishandy_TextInput";
    const params = PluginManager.parameters(PLUGIN_NAME);
    const INPUT_WIDTH_PERCENT = Number(params["InputWidth"]) / 100;
    const INPUT_HEIGHT_PERCENT = Number(params["InputHeight"]) / 100;
    // If not provided, default max lines is 10
    const DEFAULT_MAX_LINES = Number(params["DefaultMaxLines"] || 10);

    //-------------------------------------------------------------------------
    // Plugin Command Registration
    //-------------------------------------------------------------------------

    PluginManager.registerCommand(PLUGIN_NAME, "OpenTextInput", (args) => {
        const variableId = Number(args.variableId);
        const label = args.label || "Enter text:";
        // Use specified maxLines or fallback to default
        const maxLines = args.maxLines
            ? Number(args.maxLines)
            : DEFAULT_MAX_LINES;
        // Push the text input scene and prepare it with provided parameters
        SceneManager.push(Scene_TextInput);
        SceneManager.prepareNextScene(variableId, label, maxLines);
    });

    PluginManager.registerCommand(PLUGIN_NAME, "SetTextVariable", (args) => {
        const variableId = Number(args.variableId);
        const text = args.text || 0; // Default to 0 int if empty, for compatibility with conditional branches
        $gameVariables.setValue(variableId, text);
    });

    //-------------------------------------------------------------------------
    // Scene for Text Input
    //-------------------------------------------------------------------------

    class Scene_TextInput extends Scene_MenuBase {
        /**
         * Prepares the scene with variable id, label, and maximum lines.
         * @param {number} variableId - ID of the variable to store input.
         * @param {string} label - Label text displayed above input.
         * @param {number} maxLines - Maximum number of lines allowed.
         */
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

        /**
         * Calculates the vertical positions for the label, input, and button windows.
         */
        calculateWindowPositions() {
            const labelHeight = Graphics.boxHeight * 0.12;
            const inputHeight = Graphics.boxHeight * INPUT_HEIGHT_PERCENT;
            const buttonHeight = Graphics.boxHeight * 0.13;
            // Total height including padding between windows
            const totalHeight = labelHeight + inputHeight + buttonHeight + 20;
            const startY = (Graphics.boxHeight - totalHeight) / 2;

            this._positions = {
                labelY: startY,
                inputY: startY + labelHeight + 10,
                buttonY: startY + labelHeight + inputHeight + 20,
            };
        }

        /**
         * Creates the window that displays the label above the input.
         */
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

        /**
         * Creates the text input window.
         */
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

        /**
         * Creates the OK button window and assigns its handler.
         */
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

        /**
         * Called when OK button is activated.
         * Saves the entered text to the specified game variable and exits the scene.
         */
        onInputOk() {
            const text = this._inputWindow.inputText() || 0; // Default to 0 int if empty, for compatibility with conditional branches
            $gameVariables.setValue(this._variableId, text);
            this.popScene();
        }

        terminate() {
            super.terminate();
            // Ensure the HTML input element is properly cleaned up
            if (this._inputWindow) {
                this._inputWindow.destroy();
            }
        }
    }

    //-------------------------------------------------------------------------
    // Window for Multi-line Text Input
    //-------------------------------------------------------------------------

    class Window_TextInput extends Window_Base {
        /**
         * Initializes the text input window.
         * @param {number} x - x-coordinate of the window.
         * @param {number} y - y-coordinate of the window.
         * @param {number} width - Width of the window.
         * @param {number} height - Height of the window.
         * @param {number} maxLines - Maximum allowed lines of text.
         */
        initialize(x, y, width, height, maxLines) {
            super.initialize(new Rectangle(x, y, width, height));
            this._maxLines = maxLines;
            this._lines = [""]; // Array holding each line of text
            this._cursorX = 0; // Horizontal cursor position (character index)
            this._cursorY = 0; // Vertical cursor position (line index)
            this._cursorVisible = true; // For blinking effect
            this._blinkTimer = 0;
            this._visibleStartLine = 0; // The first line currently visible

            this.refresh();
            this.activate();
            this.createHtmlInput();
        }

        /**
         * Draws the text lines and calculates which lines are visible.
         */
        drawTextLines() {
            const maxVisibleLines = Math.floor(
                (this.height - this.padding * 2) / this.lineHeight()
            );
            // Center the view on the current cursor position
            let startLine = this._cursorY - Math.floor(maxVisibleLines / 2);
            startLine = Math.max(0, startLine);
            if (startLine + maxVisibleLines > this._lines.length) {
                startLine = Math.max(0, this._lines.length - maxVisibleLines);
            }
            this._visibleStartLine = startLine;

            // Draw each visible line with RPG Maker's escape codes processing.
            for (let i = 0; i < maxVisibleLines; i++) {
                const lineIndex = startLine + i;
                if (lineIndex < this._lines.length) {
                    this.drawTextEx(
                        this._lines[lineIndex],
                        this.padding,
                        this.padding + i * this.lineHeight()
                    );
                }
            }
        }

        //-------------------------------------------------------------------------
        // Utils
        //-------------------------------------------------------------------------

        /**
         * Clears and redraws the window content.
         */
        refresh() {
            this.contents.clear();
            this.drawTextLines();
            this.drawCursor();
        }

        /**
         * Main update loop for blinking cursor and touch handling.
         */
        update() {
            super.update();
            this.updateCursorBlink();
            this.updateTouchInput();
        }

        /**
         * Focuses the HTML input element and handles mobile-specific behavior.
         * For mobile devices, it temporarily removes readonly state and uses
         * a delayed focus to ensure proper keyboard display.
         */
        focusHtmlInput() {
            if (this._inputElement) {
                // Don't clear the input value when focusing
                this._inputElement.focus();

                if (Utils.isMobileDevice()) {
                    this._inputElement.readOnly = false;
                    this._inputElement.blur();
                    setTimeout(() => {
                        this._inputElement.focus();
                    }, 100);
                }
            }
        }

        /**
         * Returns the complete input text as a single string with newline characters.
         * @returns {string}
         */
        inputText() {
            return this._lines.join("\n");
        }

        //-------------------------------------------------------------------------
        // Cursor Methods
        //-------------------------------------------------------------------------

        /**
         * Draws a blinking cursor at the current text insertion point.
         */
        drawCursor() {
            if (!this._cursorVisible) return;

            const visibleLine = this._cursorY - this._visibleStartLine;
            // Only draw the cursor if the current line is visible.
            if (
                visibleLine < 0 ||
                visibleLine >=
                    Math.floor(
                        (this.height - this.padding * 2) / this.lineHeight()
                    )
            ) {
                return;
            }
            const line = this._lines[this._cursorY];
            const cursorX =
                this.padding + this.textWidth(line.substring(0, this._cursorX));
            const cursorY = this.padding + visibleLine * this.lineHeight();
            // Draw a small rectangle as the cursor.
            this.contents.fillRect(
                cursorX,
                cursorY + this.lineHeight() - 2,
                10,
                2,
                ColorManager.normalColor()
            );
        }

        /**
         * Handles the blinking effect of the text cursor.
         */
        updateCursorBlink() {
            this._blinkTimer++;
            if (this._blinkTimer >= 30) {
                this._cursorVisible = !this._cursorVisible;
                this._blinkTimer = 0;
                this.refresh();
            }
        }

        /**
         * Processes touch input to reposition the cursor if necessary.
         */
        updateTouchInput() {
            if (TouchInput.isTriggered() && this.isTouchedInside()) {
                const touchX = TouchInput.x - this.x - this.padding;
                const touchY = TouchInput.y - this.y - this.padding;
                this.moveCursorToTouch(touchX, touchY);
                this.focusHtmlInput();
            }
        }

        /**
         * Checks if the touch is within the input window.
         * @returns {boolean} True if touched inside.
         */
        isTouchedInside() {
            return (
                TouchInput.x >= this.x &&
                TouchInput.x < this.x + this.width &&
                TouchInput.y >= this.y &&
                TouchInput.y < this.y + this.height
            );
        }

        /**
         * Moves the text cursor to the position corresponding to the touch.
         * Instead of simply comparing widths, it checks each character's center
         * so that if the touch is in the left half of a character, the cursor
         * is placed at that character's beginning.
         *
         * @param {number} x - x-coordinate relative to the window's inner content.
         * @param {number} y - y-coordinate relative to the window's inner content.
         */
        moveCursorToTouch(x, y) {
            const lineHeight = this.lineHeight();
            const touchedLine = Math.floor(y / lineHeight);
            if (touchedLine < this._lines.length) {
                this._cursorY = touchedLine;
                const line = this._lines[this._cursorY];
                let bestPos = 0;
                // Iterate over each character in the line
                for (let i = 0; i < line.length; i++) {
                    // Starting x position for the current character
                    const charStart = this.textWidth(line.substring(0, i));
                    // Get width of the current character
                    const charWidth = this.textWidth(line.charAt(i));
                    // If touch is less than half the width into the character,
                    // position cursor at the beginning of this character.
                    if (x < charStart + charWidth / 2) {
                        bestPos = i;
                        break;
                    }
                    // Otherwise, place the cursor after this character.
                    bestPos = i + 1;
                }

                // Fine-tuning: Move cursor slightly left to avoid overshooting
                bestPos = Math.max(0, bestPos - 1);

                this._cursorX = bestPos;
                this.refresh();
            }
        }

        //-------------------------------------------------------------------------
        // Cursor Movement Methods
        //-------------------------------------------------------------------------

        moveCursorLeft() {
            if (this._cursorX > 0) {
                this._cursorX--;
            } else if (this._cursorY > 0) {
                // Move to end of previous line if at the beginning
                this._cursorY--;
                this._cursorX = this._lines[this._cursorY].length;
            }
        }

        moveCursorRight() {
            if (this._cursorX < this._lines[this._cursorY].length) {
                this._cursorX++;
            } else if (this._cursorY < this._lines.length - 1) {
                // Move to beginning of next line if at the end
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

        //-------------------------------------------------------------------------
        // Text Processing Methods
        //-------------------------------------------------------------------------

        /**
         * Processes a single character input.
         * If the new character causes the line to exceed the available width,
         * it attempts to break the line (if under maxLines).
         * @param {string} char - The character to process.
         */
        processChar(char) {
            const line = this._lines[this._cursorY];
            // Escape backslashes to handle special cases
            const processedChar = char === "\\" ? "\\\\" : char;
            const potentialLine =
                line.slice(0, this._cursorX) +
                processedChar +
                line.slice(this._cursorX);
            const textWidth = this.textWidth(potentialLine);
            const maxWidth = this.contentsWidth() - this.padding * 2;

            if (textWidth > maxWidth) {
                // If line is too long and we can add more lines, break the line.
                if (this._lines.length < this._maxLines) {
                    const beforeCursor = line.slice(0, this._cursorX);
                    const afterCursor = line.slice(this._cursorX);
                    this._lines[this._cursorY] = beforeCursor;
                    this._lines.splice(this._cursorY + 1, 0, afterCursor);
                    this._cursorY++;
                    this._cursorX = 0;
                    // Process the character on the new line.
                    this.processChar(char);
                }
                return;
            }
            // Insert the character into the current line.
            this._lines[this._cursorY] = potentialLine;
            this._cursorX += processedChar.length;
            this.refresh();
        }

        /**
         * Processes backspace key to delete characters.
         * It handles deletion of escaped backslashes as a single unit.
         */
        processBackspace() {
            const line = this._lines[this._cursorY];
            if (this._cursorX > 0) {
                // Check if the previous two characters form an escaped backslash.
                const prevChars = line.slice(this._cursorX - 2, this._cursorX);
                if (prevChars === "\\\\") {
                    this._lines[this._cursorY] =
                        line.slice(0, this._cursorX - 2) +
                        line.slice(this._cursorX);
                    this._cursorX -= 2;
                } else {
                    // Remove single character.
                    this._lines[this._cursorY] =
                        line.slice(0, this._cursorX - 1) +
                        line.slice(this._cursorX);
                    this._cursorX--;
                }
            } else if (this._cursorY > 0) {
                // Merge current line with previous line if at the beginning.
                const previousLine = this._lines[this._cursorY - 1];
                this._cursorX = previousLine.length;
                this._lines[this._cursorY - 1] = previousLine + line;
                this._lines.splice(this._cursorY, 1);
                this._cursorY--;
            }
            this.refresh();
        }

        /**
         * Processes the Enter key to insert a new line.
         */
        processNewLine() {
            if (this._lines.length >= this._maxLines) return;

            const line = this._lines[this._cursorY];
            const beforeCursor = line.slice(0, this._cursorX);
            const afterCursor = line.slice(this._cursorX);
            this._lines[this._cursorY] = beforeCursor;
            // Insert the remainder of the line as a new line.
            this._lines.splice(this._cursorY + 1, 0, afterCursor);
            this._cursorY++;
            this._cursorX = 0;
            this.refresh();
        }

        //-------------------------------------------------------------------------
        // HTML Input Setup and Handling
        //-------------------------------------------------------------------------

        /**
         * Creates and configures an invisible HTML input element to capture keyboard input.
         * The element is positioned off-screen but remains functional for capturing
         * keystrokes, composition events, and handling mobile keyboard interactions.
         * Sets up event listeners for input processing and key handling.
         */
        createHtmlInput() {
            this._inputElement = document.createElement("input");
            this._inputElement.type = "text";

            Object.assign(this._inputElement.style, {
                position: "absolute",
                opacity: "0",
                left: "0",
                top: "0",
                width: "1px",
                height: "1px",
            });

            // Disable suggestions and autocorrect
            this._inputElement.setAttribute("autocomplete", "off");
            this._inputElement.setAttribute("autocorrect", "off");
            this._inputElement.setAttribute("autocapitalize", "off");
            this._inputElement.setAttribute("spellcheck", "false");
            this._inputElement.setAttribute("data-gramm", "false");

            document.body.appendChild(this._inputElement);

            // Initialize state tracking
            this._isComposing = false;
            this._lastInputValue = "";

            // Handle composition events
            this._inputElement.addEventListener("compositionstart", () => {
                this._isComposing = true;
            });

            this._inputElement.addEventListener("compositionend", () => {
                this._isComposing = false;
                this.processInputDifference();
            });

            // Modified input handler
            this._boundOnInputChange = (event) => {
                if (!this._isComposing) {
                    this.processInputDifference();
                }
            };

            // Keydown handler
            this._boundHandleKeyDown = (event) => {
                switch (event.key) {
                    case "ArrowLeft":
                        event.preventDefault();
                        this.moveCursorLeft();
                        this._lastInputValue = "";
                        this._inputElement.value = "";
                        this.refresh();
                        break;
                    case "ArrowRight":
                        event.preventDefault();
                        this.moveCursorRight();
                        this._lastInputValue = "";
                        this._inputElement.value = "";
                        this.refresh();
                        break;
                    case "ArrowUp":
                        event.preventDefault();
                        this.moveCursorUp();
                        this._lastInputValue = "";
                        this._inputElement.value = "";
                        this.refresh();
                        break;
                    case "ArrowDown":
                        event.preventDefault();
                        this.moveCursorDown();
                        this._lastInputValue = "";
                        this._inputElement.value = "";
                        this.refresh();
                        break;
                    case "Backspace":
                        event.preventDefault();
                        this.processBackspace();
                        this._lastInputValue = this._inputElement.value;
                        this.refresh();
                        break;
                    case "Enter":
                        event.preventDefault();
                        this.processNewLine();
                        this._lastInputValue = "";
                        this._inputElement.value = "";
                        this.refresh();
                        break;
                }
            };

            this._inputElement.addEventListener(
                "input",
                this._boundOnInputChange
            );
            this._inputElement.addEventListener(
                "keydown",
                this._boundHandleKeyDown
            );

            this.focusHtmlInput();
        }

        /**
         * Compares current input value with previous value to determine changes
         * and processes any differences. This handles both single character inputs
         * and composition-based inputs (like IME) by detecting added or removed
         * characters and applying them to the text window.
         */
        processInputDifference() {
            const currentValue = this._inputElement.value;
            const previousValue = this._lastInputValue;

            // Find the difference between current and last value
            if (currentValue.length > previousValue.length) {
                // New characters were added
                const newText = currentValue.slice(previousValue.length);
                for (const char of newText) {
                    this.processChar(char);
                }
            } else if (currentValue.length < previousValue.length) {
                // Characters were removed
                const deletedCount = previousValue.length - currentValue.length;
                for (let i = 0; i < deletedCount; i++) {
                    this.processBackspace();
                }
            }

            // Update the last known value
            this._lastInputValue = currentValue;

            this.refresh();
        }

        /**
         * Called when the HTML input changes. Processes new characters or new lines.
         * @param {InputEvent} event
         */
        onInputChange(event) {
            const value = event.target.value;
            if (value) {
                if (value === "\n") {
                    this.processNewLine();
                } else {
                    // Process each character typed.
                    for (const char of value) {
                        this.processChar(char);
                    }
                }
                // Clear the input after processing.
                this._inputElement.value = "";
                this.refresh();
            }
        }

        /**
         * Cleanly removes the HTML input element and its event listeners.
         */
        destroy() {
            if (this._inputElement) {
                this._inputElement.removeEventListener(
                    "input",
                    this._boundOnInputChange
                );
                this._inputElement.removeEventListener(
                    "keydown",
                    this._boundHandleKeyDown
                );
                document.body.removeChild(this._inputElement);
                this._inputElement = null;
            }
            super.destroy();
        }
    }

    //-------------------------------------------------------------------------
    // Window for OK Button
    //-------------------------------------------------------------------------

    class Window_OkButton extends Window_Command {
        /**
         * Constructs the OK button window.
         * @param {number} x - x-coordinate.
         * @param {number} y - y-coordinate.
         * @param {number} width - Width of the button.
         * @param {number} height - Height of the button.
         */
        constructor(x, y, width, height) {
            super(new Rectangle(x, y, width, height));
            this.refresh();
        }

        /**
         * Defines the command list. In this case, only a check mark is needed.
         */
        makeCommandList() {
            this.addCommand("✓", "ok");
        }

        /**
         * Updates the button, processing touch input only.
         */
        update() {
            super.update();
            if (this.active && TouchInput.isTriggered()) {
                if (this.isTouchedInside(TouchInput.x, TouchInput.y)) {
                    this.callOkHandler();
                }
            }
        }

        /**
         * Checks if a given (x, y) coordinate is inside the button area.
         * @param {number} x
         * @param {number} y
         * @returns {boolean}
         */
        isTouchedInside(x, y) {
            return (
                x >= this.x &&
                x < this.x + this.width &&
                y >= this.y &&
                y < this.y + this.height
            );
        }

        /**
         * Overrides default keyboard handling to disable accidental triggering.
         */
        processHandling() {
            // Intentionally empty: disable keyboard input for the OK button.
        }
    }

    //-------------------------------------------------------------------------
    // SceneManager Extension for Passing Parameters
    //-------------------------------------------------------------------------

    // Extend SceneManager to pass parameters to the next scene
    const _SceneManager_prepareNextScene = SceneManager.prepareNextScene;
    SceneManager.prepareNextScene = function (variableId, label, maxLines) {
        _SceneManager_prepareNextScene.call(this);
        if (this._nextScene && typeof this._nextScene.prepare === "function") {
            this._nextScene.prepare(variableId, label, maxLines);
        }
    };
})();

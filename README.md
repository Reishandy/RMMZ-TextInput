# RMMZ-TextInput

## 📝 A Multi-line Text Input System for RPG Maker MZ

A robust text input plugin that provides seamless text entry on both desktop and mobile platforms, featuring full keyboard and touch support.

![Showcase](showcase.png)

## ✨ Key Features

- **Multi-line Text Input**
  - Customizable line limits
  - Automatic text wrapping
  - IME support for international text

- **User Interface**
  - Custom label text
  - RPG Maker styled windows
  - Confirmation button
  - Visual cursor with blinking effect

- **Input Methods**
  - Full keyboard navigation
  - Touch/mouse cursor positioning
  - Mobile keyboard optimization
  - Arrow key support

- **Integration**
  - Variable storage system
  - Plugin command interface
  - Customizable dimensions
  - Event system compatibility

## 🛠️ Installation

1. Download `Reishandy_TextInput.js`
2. Place in your project's `js/plugins` folder
3. Enable via Plugin Manager

## ⚙️ Configuration

### Plugin Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| Input Width (%) | Width of the input box | 70 |
| Input Height (%) | Height of the input box | 50 |

### Plugin Commands

#### 1. OpenTextInput
```javascript
{
  variableId: 1,      // Game variable to store result
  label: "Enter text:", // Display text above input
  maxLines: 10        // Maximum allowed lines (1-100)
}
```

#### 2. SetTextVariable
```javascript
{
  variableId: 1,   // Target variable
  text: "Content"  // Text to store
}
```

## 📖 Usage Example

1. Create a new event
2. Add a "Plugin Command"
3. Select "Text Input" and "Open Text Input"
4. Configure parameters:
```javascript
Variable ID: 1
Label: "Enter your message:"
Max Lines: 5
```

![Command](command.png)

## 📱 Device Support

- ✅ Windows/Mac/Linux
- ✅ Mobile Browsers
- ✅ Desktop Browsers
- ✅ Touch Devices

## 🤝 Compatibility

- RPG Maker MZ
- Should be compatible with most other plugins

## 📃 Terms of Use

- Free for commercial use
- Free for non-commercial use
- Credit appreciated but not required

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

Created by [Reishandy](https://github.com/Reishandy)



document.addEventListener('DOMContentLoaded', () => {
    // Element References
    const lengthSlider = document.getElementById('length-slider');
    const lengthInput = document.getElementById('length-input');
    const decrementButton = document.getElementById('decrement-button');
    const incrementButton = document.getElementById('increment-button');
    const passwordDisplay = document.getElementById('password-display');
    const generateButton = document.getElementById('generate-button');
    const copyButton = document.getElementById('copy-button');
    const copyIcon = document.getElementById('copy-icon');
    const checkIcon = document.getElementById('check-icon');
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');

    // Character set options, including the new 'ambiguous' flag
    const options = {
        uppercase: document.getElementById('uppercase'),
        lowercase: document.getElementById('lowercase'),
        numbers: document.getElementById('numbers'),
        symbols: document.getElementById('symbols'),
        ambiguous: document.getElementById('ambiguous') // New checkbox
    };

    // Define character sets for password generation
    const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
    };

    // Characters considered ambiguous (lI1O0o)
    const ambiguousChars = 'lI1O0o';

    /**
     * Synchronizes the value between the range slider and the number input,
     * clamps the value within min/max, and updates the slider's visual progress.
     * @param {HTMLElement} sourceElement The input element that triggered the change (slider or number input).
     */
    const syncLengthValues = (sourceElement) => {
        // Read and clamp the input value based on min/max attributes
        const value = parseInt(sourceElement.value, 10);
        const min = parseInt(sourceElement.min, 10);
        const max = parseInt(sourceElement.max, 10);

        if (isNaN(value)) {
            // Reset to minimum if input is invalid
            lengthInput.value = min;
            lengthSlider.value = min;
        } else {
            // Ensure the value stays within min/max bounds
            const clampedValue = Math.max(min, Math.min(value, max));
            lengthInput.value = clampedValue;
            lengthSlider.value = clampedValue;
        }

        // Calculate the percentage of the slider's progress
        const percent = ((lengthSlider.value - min) / (max - min)) * 100;
        // Update the CSS variable to fill the track 
        lengthSlider.style.setProperty('--progress-percent', `${percent}%`);
    };

    /**
     * Calculates the password strength based on length and character type diversity.
     * @param {string} password The generated password string.
     */
    const checkPasswordStrength = (password) => {
        let score = 0;
        if (!password || password === 'Select an option') {
            score = -1;
        } else {
            const length = password.length;
            // Length scoring (more points for longer passwords)
            if (length >= 8) score++;
            if (length >= 12) score++;
            if (length >= 16) score++;

            // Character type scoring (diversity using regex tests)
            if (/[a-z]/.test(password)) score++;
            if (/[A-Z]/.test(password)) score++;
            if (/[0-9]/.test(password)) score++;
            if (/[^A-Za-z0-9]/.test(password)) score++;
        }

        const strengthLevels = {
            '-1': { text: 'Empty', color: 'bg-gray-400', width: '0%' },
            0: { text: 'Very Weak', color: 'bg-red-700', width: '10%' },
            1: { text: 'Very Weak', color: 'bg-red-600', width: '20%' },
            2: { text: 'Weak', color: 'bg-red-500', width: '35%' },
            3: { text: 'Medium', color: 'bg-orange-500', width: '50%' },
            4: { text: 'Medium', color: 'bg-yellow-500', width: '65%' },
            5: { text: 'Strong', color: 'bg-green-500', width: '80%' },
            6: { text: 'Very Strong', color: 'bg-green-600', width: '90%' },
            7: { text: 'Excellent', color: 'bg-green-700', width: '100%' },
        };

        const level = strengthLevels[score.toString()] || strengthLevels['-1'];

        // Apply visual updates to the strength indicator
        strengthBar.style.width = level.width;
        // Use DOM manipulation to clear and re-add the color class safely for smooth transition
        strengthBar.className = `h-2.5 rounded-full transition-all duration-500 ${level.color}`;
        strengthText.textContent = level.text;
    };

    /**
     * Core function to generate a new password based on current settings.
     */
    const generatePassword = () => {
        // Ensure slider/input values are synced before generation
        syncLengthValues(lengthSlider);

        const length = parseInt(lengthSlider.value, 10);
        let characterPool = '';
        let guaranteedChars = []; // Array to ensure at least one character from each selected set is included

        // Filter keys to get only active character sets
        const charKeys = ['uppercase', 'lowercase', 'numbers', 'symbols'];
        const selectedOptions = charKeys.filter(key => options[key].checked);

        if (selectedOptions.length === 0) {
            passwordDisplay.textContent = 'Select an option';
            checkPasswordStrength(null);
            return;
        }

        const excludeAmbiguous = options.ambiguous.checked;

        // 1. Build the pool and add guaranteed characters
        selectedOptions.forEach(key => {
            let set = charSets[key];

            // Filter out ambiguous characters if the option is checked
            if (excludeAmbiguous) {
                set = set.split('').filter(char => !ambiguousChars.includes(char)).join('');
            }

            if (set.length > 0) {
                characterPool += set;
                // Add one random character from the set to the guaranteed list
                guaranteedChars.push(set[Math.floor(Math.random() * set.length)]);
            }
        });

        // Check if the combination of exclusions and length allows for a valid password
        if (characterPool.length === 0) {
            passwordDisplay.textContent = 'No available characters.';
            checkPasswordStrength(null);
            return;
        }

        // 2. Fill the remaining length with random characters from the combined pool
        let password = '';
        const remainingLength = length - guaranteedChars.length;
        for (let i = 0; i < remainingLength; i++) {
            const randomIndex = Math.floor(Math.random() * characterPool.length);
            password += characterPool[randomIndex];
        }

        // 3. Combine guaranteed chars and random chars, then shuffle
        let finalPasswordArray = (password + guaranteedChars.join('')).split('');
        for (let i = finalPasswordArray.length - 1; i > 0; i--) {
            // Fisher-Yates shuffle algorithm
            const j = Math.floor(Math.random() * (i + 1));
            [finalPasswordArray[i], finalPasswordArray[j]] = [finalPasswordArray[j], finalPasswordArray[i]];
        }

        const finalPassword = finalPasswordArray.join('');

        // Animate password reveal (staggered character display)
        passwordDisplay.textContent = '';
        for (let i = 0; i < finalPassword.length; i++) {
            const charSpan = document.createElement('span');
            charSpan.textContent = finalPassword[i];
            charSpan.className = 'password-reveal inline-block';
            charSpan.style.animationDelay = `${i * 20}ms`; // Stagger the animation
            passwordDisplay.appendChild(charSpan);
        }

        checkPasswordStrength(finalPassword);

        // Animate generate button icon (360 degree rotation)
        const icon = generateButton.querySelector('#generate-icon');
        // Use a counter stored on the element to track cumulative rotation
        const currentRotation = parseInt(icon.dataset.rotation || 0);
        const newRotation = currentRotation + 360;
        icon.style.transform = `rotate(${newRotation}deg)`;
        icon.dataset.rotation = newRotation;
    };

    /**
     * Copies the generated password to the user's clipboard.
     */
    const copyToClipboard = () => {
        const passwordToCopy = Array.from(passwordDisplay.children).map(span => span.textContent).join('');
        if (!passwordToCopy || passwordToCopy === 'Select an option' || passwordToCopy === 'No available characters.') return;

        // Clipboard logic (using fallback for iframe restrictions)
        const executeCopy = (text) => {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = 'fixed'; // Avoid scrolling
            textArea.style.opacity = '0'; // Hide textarea
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');

                // Icon animation for success feedback
                copyIcon.style.transform = 'scale(0)';
                checkIcon.style.transform = 'scale(1) translate(-50%, -50%)';

                setTimeout(() => {
                    copyIcon.style.transform = 'scale(1)';
                    checkIcon.style.transform = 'scale(0) translate(-50%, -50%)';
                }, 2000);

            } catch (err) {
                console.error('Copy failed: ', err);
            }
            document.body.removeChild(textArea);
        };

        // Use the fallback method for compatibility
        executeCopy(passwordToCopy);
    };

    // --- EVENT LISTENERS ---

    // Sync the slider and number input on continuous input
    lengthSlider.addEventListener('input', () => syncLengthValues(lengthSlider));
    lengthInput.addEventListener('input', () => syncLengthValues(lengthInput));

    // Buttons to manually adjust length
    decrementButton.addEventListener('click', () => {
        const currentVal = parseInt(lengthInput.value, 10);
        const min = parseInt(lengthInput.min, 10);
        if (currentVal > min) {
            lengthInput.value = currentVal - 1;
            syncLengthValues(lengthInput);
            generatePassword();
        }
    });
    incrementButton.addEventListener('click', () => {
        const currentVal = parseInt(lengthInput.value, 10);
        const max = parseInt(lengthInput.max, 10);
        if (currentVal < max) {
            lengthInput.value = currentVal + 1;
            syncLengthValues(lengthInput);
            generatePassword();
        }
    });

    // Primary actions
    generateButton.addEventListener('click', generatePassword);
    copyButton.addEventListener('click', copyToClipboard);

    // Re-generate password when any setting changes
    Object.values(options).forEach(option => {
        option.addEventListener('change', generatePassword);
    });
    lengthSlider.addEventListener('change', generatePassword);
    lengthInput.addEventListener('change', generatePassword);

    // Initial application setup
    syncLengthValues(lengthSlider);
    generatePassword();
});

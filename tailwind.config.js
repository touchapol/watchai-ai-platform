/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2b8cee",
                "background-light": "#f6f7f8",
                "background-dark": "#101922",
                "surface-dark": "#1e293b",
                "surface-light": "#ffffff",
                "pastel-blue": "#0EA5E9",
                "pastel-pink": "#F472B6",
            },
            fontFamily: {
                sans: ["var(--font-kanit)", "Kanit", "sans-serif"],
                display: ["var(--font-kanit)", "Kanit", "sans-serif"],
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
    ],
};


// Smooth Scroll Effect
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.info-section');
    sections.forEach(section => {
        section.addEventListener('mouseover', () => {
            section.style.transform = "scale(1.05)";
        });

        section.addEventListener('mouseout', () => {
            section.style.transform = "scale(1)";
        });
    });
});

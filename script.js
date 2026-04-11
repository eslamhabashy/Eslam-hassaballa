document.addEventListener('DOMContentLoaded', () => {

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if(mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('.nav-links a, .hero-cta a').forEach(anchor => {
        if(anchor.getAttribute('href').startsWith('#')) {
            anchor.addEventListener('click', function(e) {
                e.preventDefault();
                navLinks.classList.remove('active'); // close menu on click
                
                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if(targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 80, // offset for fixed header
                        behavior: 'smooth'
                    });
                }
            });
        }
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                // Optional: Stop observing once animated
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    // Modal Logic
    const projectData = {
        drone: {
            title: "Drone Development",
            tags: ["ArduPilot", "Pixhawk", "Raspberry Pi"],
            description: "A comprehensive project involving the design and assembly of small-scale multirotor drones. Key responsibilities included component selection (brushless motors, ESCs, flight controllers), power system distribution, and soldering. I actively utilized ArduPilot and Pixhawk platforms for initial flight testing and PID tuning to achieve stable flight characteristics.",
            images: ["assets/drone.png", "assets/drone_2.png"]
        },
        robot: {
            title: "Autonomous Mobile Robot",
            tags: ["Sensors", "Navigation", "Embedded Systems"],
            description: "Developed as a Bachelor thesis, this project focused on autonomous ground navigation. Built a robust mobile platform integrated with sensor arrays to map and traverse dynamic environments. The control logic was written for real-time embedded systems, managing the interface between high-level path planning algorithms and low-level motor actuation.",
            images: ["assets/robot.png", "assets/robot_2.png"]
        },
        cyclekart: {
            title: "Hybrid Cyclekart",
            tags: ["Fabrication", "Welding", "Chassis Design"],
            description: "Started as a passion project, this full-scale 2-seater vehicle combines classic cyclekart aesthetics with hybrid drivetrain mechanics. The entire chassis was custom-designed and welded from tubular steel. Intensive hands-on work was required for the steering geometry integration, suspension mounting, and overall mechanical assembly, pushing my fabrication skills to the next level.",
            images: ["assets/cyclekart.png", "assets/cyclekart_2.png"]
        }
    };

    const modal = document.getElementById('projectModal');
    const closeModal = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalTags = document.getElementById('modalTags');
    const modalDescription = document.getElementById('modalDescription');
    const modalCarousel = document.getElementById('modalCarousel');

    if(modal) {
        document.querySelectorAll('.clickable-project').forEach(card => {
            card.addEventListener('click', () => {
                const projectId = card.getAttribute('data-project');
                const data = projectData[projectId];
                
                if(data) {
                    modalTitle.textContent = data.title;
                    
                    modalTags.innerHTML = '';
                    data.tags.forEach(tag => {
                        const span = document.createElement('span');
                        span.className = 'tag';
                        span.textContent = tag;
                        modalTags.appendChild(span);
                    });
                    
                    modalDescription.textContent = data.description;
                    
                    modalCarousel.innerHTML = '';
                    data.images.forEach(imgSrc => {
                        const img = document.createElement('img');
                        img.src = imgSrc;
                        modalCarousel.appendChild(img);
                    });
                    
                    modal.classList.add('active');
                    document.body.style.overflow = 'hidden'; // prevent background scrolling
                }
            });
        });

        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto'; // allow background scrolling
        });

        modal.addEventListener('click', (e) => {
            if(e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto'; // allow background scrolling
            }
        });
    }
});

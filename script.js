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

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('.nav-links a, .hero-cta a').forEach(anchor => {
        if (anchor.getAttribute('href').startsWith('#')) {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                navLinks.classList.remove('active'); // close menu on click

                const targetId = this.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);

                if (targetSection) {
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

    // Initialize Supabase
    const SUPABASE_URL = 'https://hkmtuiakkmpfigfysuoh.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrbXR1aWFra21wZmlnZnlzdW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTgwMjAsImV4cCI6MjA5MTQ3NDAyMH0.94A4cE0T6QrfjbAy5P7SU6whs1b8Q3DWSEg7XR3jI5w';
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Modal & Grid Elements
    const modal = document.getElementById('projectModal');
    const closeModal = document.getElementById('closeModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalTags = document.getElementById('modalTags');
    const modalDescription = document.getElementById('modalDescription');
    const modalCarousel = document.getElementById('modalCarousel');
    const projectGrid = document.getElementById('projectGrid');

    let loadedProjects = {}; // To store fetched projects by slug

    async function fetchProjects() {
        if (!projectGrid) return;

        try {
            const { data, error } = await sb
                .from('projects')
                .select('*')
                .order('order_index', { ascending: true });

            if (error) throw error;

            projectGrid.innerHTML = ''; // Clear loading state
            loadedProjects = {};

            if (data && data.length > 0) {
                data.forEach((project, index) => {
                    loadedProjects[project.slug] = project;

                    const card = document.createElement('div');
                    card.className = 'project-card animate-on-scroll slide-up clickable-project in-view';
                    card.style.setProperty('--delay', index + 1);
                    card.setAttribute('data-project', project.slug);

                    // Format tags for overlay (grab up to first 2 tags)
                    const overlayTags = (project.tags || []).slice(0, 2).map(tag => `<span>${tag}</span>`).join('');

                    card.innerHTML = `
                        <div class="project-img">
                            <img src="${project.thumbnail || 'assets/robot.png'}" alt="${project.title}">
                            <div class="project-overlay">
                                ${overlayTags}
                            </div>
                        </div>
                        <div class="project-info">
                            <h3>${project.title}</h3>
                            <p>${project.description ? (project.description.substring(0, 120) + '...') : ''}</p>
                            <span class="read-more">View Details &rarr;</span>
                        </div>
                    `;

                    // Attach event listener immediately to the new card
                    card.addEventListener('click', () => openModal(project.slug));

                    projectGrid.appendChild(card);
                });
            } else {
                projectGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">No projects found in database. Run the SQL script to create the table and add data!</p>';
            }
        } catch (err) {
            console.error("Error fetching projects from Supabase:", err.message);
            projectGrid.innerHTML = '<p style="text-align: center; grid-column: 1/-1; color: #ff6b6b;">Error loading projects. Check console.</p>';
        }
    }

    fetchProjects();

    async function fetchProfile() {
        try {
            const { data, error } = await sb.from('profile').select('*').eq('id', 1).single();
            if (error) throw error;
            if (data) {
                const navImg = document.querySelector('.nav-profile .profile-img');
                if (navImg) {
                    navImg.src = data.photo_url || 'assets/robot.png';
                    navImg.style.objectPosition = `center ${data.photo_pos || 50}%`;
                }
            }
        } catch (err) {
            console.error("Error fetching profile:", err.message);
        }
    }
    fetchProfile();

    function getYoutubeEmbed(url) {
        if (!url) return null;
        if (typeof url !== 'string') return null;
        // If it's already an embed link, return as is
        if (url.includes('/embed/')) return url;

        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length == 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
    }

    function openModal(slug) {
        if (!modal) return;
        const data = loadedProjects[slug];
        if (!data) return;

        modalTitle.textContent = data.title;

        modalTags.innerHTML = '';
        (data.tags || []).forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tag;
            modalTags.appendChild(span);
        });

        modalDescription.textContent = data.description;

        modalCarousel.innerHTML = '';
        if (data.embed) {
            const iframe = document.createElement('iframe');
            iframe.src = getYoutubeEmbed(data.embed);
            iframe.frameBorder = "0";
            iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
            iframe.allowFullscreen = true;
            iframe.style.width = "100%";
            iframe.style.aspectRatio = "16/9";
            modalCarousel.appendChild(iframe);
        }
        if (data.images && data.images.length > 0) {
            data.images.forEach(imgSrc => {
                const img = document.createElement('img');
                img.src = imgSrc;
                modalCarousel.appendChild(img);
            });
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // prevent background scrolling
    }

    // Modal close handlers
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        });
    }
});

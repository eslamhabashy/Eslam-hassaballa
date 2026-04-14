document.addEventListener('DOMContentLoaded', () => {
    const SUPABASE_URL = 'https://hkmtuiakkmpfigfysuoh.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrbXR1aWFra21wZmlnZnlzdW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTgwMjAsImV4cCI6MjA5MTQ3NDAyMH0.94A4cE0T6QrfjbAy5P7SU6whs1b8Q3DWSEg7XR3jI5w';
    const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const authPanel = document.getElementById('authPanel');
    const adminPanel = document.getElementById('adminPanel');
    const logoutBtn = document.getElementById('logoutBtn');
    const editForm = document.getElementById('editForm');
    const projectList = document.getElementById('projectList');
    const addNewBtn = document.getElementById('addNewBtn');

    let projectsData = [];
    let currentGallery = [];
    let isEditing = false;

    // ── Auth ──
    async function checkSession() {
        const { data: { session } } = await sb.auth.getSession();
        if (session) {
            authPanel.style.display = 'none';
            adminPanel.style.display = 'block';
            logoutBtn.style.display = 'block';
            loadProjects();
            loadProfile();
        } else {
            authPanel.style.display = 'block';
            adminPanel.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    }

    document.getElementById('loginBtn').addEventListener('click', async () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('authError');
        const btn = document.getElementById('loginBtn');

        errorEl.textContent = '';
        btn.textContent = 'Logging in...';
        btn.disabled = true;

        try {
            const { data, error } = await sb.auth.signInWithPassword({ email, password });
            if (error) throw error;
            await checkSession();
        } catch (err) {
            errorEl.textContent = err.message || 'Invalid login credentials.';
            console.error('Login error:', err);
        } finally {
            btn.textContent = 'Login to Dashboard';
            btn.disabled = false;
        }
    });

    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        await sb.auth.signOut();
        checkSession();
    });

    // ── Load Projects ──
    async function loadProjects() {
        const container = document.getElementById('projectsContainer');
        container.innerHTML = '<p>Loading…</p>';

        try {
            const { data, error } = await sb.from('projects').select('*').order('order_index');
            if (error) throw error;
            projectsData = data;

            if (!data.length) {
                container.innerHTML = '<p>No projects found.</p>';
                return;
            }

            container.innerHTML = '';
            data.forEach((p, index) => {
                const el = document.createElement('div');
                el.className = 'project-list-item';
                el.innerHTML = `
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div class="reorder-controls">
                            <button class="move-btn" onclick="moveProject('${p.id}', -1)" ${index === 0 ? 'disabled' : ''}>▲</button>
                            <button class="move-btn" onclick="moveProject('${p.id}', 1)" ${index === data.length - 1 ? 'disabled' : ''}>▼</button>
                        </div>
                        <img src="${p.thumbnail || 'assets/robot.png'}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
                        <div>
                            <strong style="font-size:1.1rem; display:block;">${p.title}</strong>
                            <span style="font-size:0.8rem; color:var(--text-muted);">${p.slug}</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button class="btn btn-secondary edit-btn" data-id="${p.id}">✏️ Edit</button>
                        <button class="btn btn-danger delete-btn" data-id="${p.id}">🗑️ Delete</button>
                    </div>
                `;
                container.appendChild(el);
            });

            // Attach edit click listeners
            container.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', () => editProject(btn.dataset.id));
            });

            // Attach delete click listeners
            container.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = btn.getAttribute('data-id');
                    console.log('Delete button clicked for ID:', id);
                    deleteProject(id);
                });
            });

        } catch (err) {
            container.innerHTML = `<span style="color:#ff6b6b;">Database Error: ${err.message}</span>`;
        }
    }
    
    // ── Reordering Logic ──
    window.moveProject = async (id, direction) => {
        const index = projectsData.findIndex(p => p.id === id);
        if (index === -1) return;
        
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= projectsData.length) return;
        
        const currentProject = projectsData[index];
        const targetProject = projectsData[targetIndex];
        
        // Swap order_index
        const currentIndex = currentProject.order_index;
        const targetOrderIndex = targetProject.order_index;
        
        try {
            // Update both in database
            const { error: error1 } = await sb.from('projects').update({ order_index: targetOrderIndex }).eq('id', currentProject.id);
            if (error1) throw error1;
            
            const { error: error2 } = await sb.from('projects').update({ order_index: currentIndex }).eq('id', targetProject.id);
            if (error2) throw error2;
            
            loadProjects(); // Refresh UI
        } catch (err) {
            console.error('Error reordering:', err);
            alert('Failed to reorder projects: ' + err.message);
        }
    };

    // ── Delete ──
    async function deleteProject(id) {
        console.log('Attempting to delete project with ID:', id);
        if (!id) {
            console.error('No ID found for deletion');
            return;
        }

        const p = projectsData.find(x => x.id === id);
        if (!p) {
            console.error('Project not found in local data for ID:', id);
            return;
        }

        if (!confirm(`Are you sure you want to delete "${p.title}"? This cannot be undone.`)) {
            console.log('Deletion cancelled by user.');
            return;
        }

        try {
            console.log('Sending delete request to Supabase...');
            const { error } = await sb.from('projects').delete().eq('id', id);

            if (error) {
                console.error('Supabase Delete Error:', error);
                throw error;
            }

            console.log('Project deleted successfully. Refreshing list...');
            loadProjects();
        } catch (err) {
            alert(`Error deleting project: ${err.message}`);
            console.error('Delete function catch block:', err);
        }
    }

    // ── Profile Management ──
    async function loadProfile() {
        try {
            const { data, error } = await sb.from('profile').select('*').eq('id', 1).single();
            if (error) throw error;

            if (data) {
                document.getElementById('profileUrl').value = data.photo_url || '';
                document.getElementById('profilePos').value = data.photo_pos || 50;

                const previewImg = document.getElementById('profilePreviewImg');
                previewImg.src = data.photo_url || 'assets/robot.png';
                previewImg.style.objectPosition = `center ${data.photo_pos}%`;
            }
        } catch (err) {
            console.error('Error loading profile:', err);
        }
    }

    // Profile File Preview
    document.getElementById('profileFile').addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = e => {
                const previewImg = document.getElementById('profilePreviewImg');
                previewImg.src = e.target.result;
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Profile Position Preview
    document.getElementById('profilePos').addEventListener('input', function () {
        const previewImg = document.getElementById('profilePreviewImg');
        previewImg.style.objectPosition = `center ${this.value}%`;
    });

    // Save Profile
    document.getElementById('saveProfileBtn').addEventListener('click', async () => {
        const btn = document.getElementById('saveProfileBtn');
        const errEl = document.getElementById('profileError');
        const fileInput = document.getElementById('profileFile');
        let photoUrl = document.getElementById('profileUrl').value;
        const photoPos = parseInt(document.getElementById('profilePos').value);

        errEl.textContent = 'Saving profile...';
        errEl.style.color = 'var(--primary)';
        btn.disabled = true;

        try {
            // Upload if new file selected
            if (fileInput.files.length > 0) {
                errEl.textContent = 'Uploading new photo...';
                const file = fileInput.files[0];
                const ext = file.name.split('.').pop();
                const fileName = `profile_${Date.now()}.${ext}`;
                const filePath = `profile/${fileName}`;

                const { error: uploadError } = await sb.storage.from('images').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data: publicUrlData } = sb.storage.from('images').getPublicUrl(filePath);
                photoUrl = publicUrlData.publicUrl;
            }

            const { error } = await sb.from('profile').update({
                photo_url: photoUrl,
                photo_pos: photoPos,
                updated_at: new Date()
            }).eq('id', 1);

            if (error) throw error;

            errEl.textContent = 'Profile updated successfully!';
            errEl.style.color = '#00e676';
            setTimeout(() => { errEl.textContent = ''; }, 3000);
        } catch (err) {
            errEl.style.color = '#ff6b6b';
            errEl.textContent = err.message;
            console.error(err);
        } finally {
            btn.disabled = false;
        }
    });

    // ── YouTube Embed Helper ──
    function getYoutubeEmbed(url) {
        if (!url) return null;
        // If it's already an embed link, return as is
        if (url.includes('/embed/')) return url;

        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length == 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
    }

    // ── Slug Generation ──
    document.getElementById('pTitle').addEventListener('input', (e) => {
        if (!isEditing) {
            const slug = e.target.value
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            document.getElementById('pSlug').value = slug;
        }
    });

    // ── Add New ──
    addNewBtn.addEventListener('click', () => {
        isEditing = false;
        document.getElementById('projectId').value = '';
        document.getElementById('pTitle').value = '';
        document.getElementById('pSlug').value = '';
        document.getElementById('pDesc').value = '';
        document.getElementById('pTags').value = '';
        document.getElementById('pThumbnailUrl').value = '';
        document.getElementById('pEmbed').value = '';
        document.getElementById('formError').textContent = '';
        document.getElementById('pThumbnailFile').value = '';
        document.getElementById('pGalleryFiles').value = '';
        document.getElementById('thumbnailPreview').style.display = 'none';
        document.getElementById('newGalleryPreviews').style.display = 'none';
        document.getElementById('newGalleryPreviews').innerHTML = '';

        currentGallery = [];
        renderGallery();

        document.getElementById('formTitle').textContent = 'Add New Project';
        projectList.style.display = 'none';
        editForm.style.display = 'block';
    });

    // ── Edit ──
    function editProject(id) {
        const p = projectsData.find(x => x.id === id);
        if (!p) return;

        isEditing = true;
        document.getElementById('projectId').value = p.id;
        document.getElementById('pTitle').value = p.title || '';
        document.getElementById('pSlug').value = p.slug || '';
        document.getElementById('pDesc').value = p.description || '';
        document.getElementById('pTags').value = (p.tags || []).join(', ');
        document.getElementById('pThumbnailUrl').value = p.thumbnail || '';
        document.getElementById('pEmbed').value = p.embed || '';
        document.getElementById('formError').textContent = '';
        document.getElementById('pThumbnailFile').value = '';
        document.getElementById('pGalleryFiles').value = '';
        document.getElementById('newGalleryPreviews').style.display = 'none';
        document.getElementById('newGalleryPreviews').innerHTML = '';

        currentGallery = [...(p.images || [])];
        renderGallery();

        const preview = document.getElementById('thumbnailPreview');
        if (p.thumbnail) {
            preview.src = p.thumbnail;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }

        document.getElementById('formTitle').textContent = `Editing: ${p.title}`;
        projectList.style.display = 'none';
        editForm.style.display = 'block';
    }

    function renderGallery() {
        const container = document.getElementById('galleryList');
        container.innerHTML = '';

        if (currentGallery.length > 0) {
            const label = document.createElement('label');
            label.textContent = 'Existing Photos:';
            label.style.gridColumn = '1/-1';
            label.style.fontSize = '12px';
            label.style.marginTop = '10px';
            container.appendChild(label);
        }

        currentGallery.forEach((url, index) => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.innerHTML = `
                <img src="${url}" alt="Gallery image">
                <button class="remove-img" onclick="removeGalleryImg(${index})">&times;</button>
            `;
            container.appendChild(div);
        });
    }

    window.removeGalleryImg = (index) => {
        currentGallery.splice(index, 1);
        renderGallery();
    };

    document.getElementById('cancelBtn').addEventListener('click', () => {
        editForm.style.display = 'none';
        projectList.style.display = 'block';
    });

    // Thumbnail file preview
    document.getElementById('pThumbnailFile').addEventListener('change', function () {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = e => {
                document.getElementById('thumbnailPreview').src = e.target.result;
                document.getElementById('thumbnailPreview').style.display = 'block';
            };
            reader.readAsDataURL(this.files[0]);
        }
    });

    // Gallery files preview
    document.getElementById('pGalleryFiles').addEventListener('change', function () {
        const previewContainer = document.getElementById('newGalleryPreviews');
        previewContainer.innerHTML = '';

        if (this.files.length > 0) {
            const label = document.createElement('label');
            label.textContent = 'New Photos Selected:';
            label.style.gridColumn = '1/-1';
            label.style.fontSize = '12px';
            previewContainer.appendChild(label);

            Array.from(this.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = e => {
                    const div = document.createElement('div');
                    div.className = 'gallery-item';
                    div.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
                    previewContainer.appendChild(div);
                };
                reader.readAsDataURL(file);
            });
            previewContainer.style.display = 'grid';
        } else {
            previewContainer.style.display = 'none';
        }
    });

    // ── Save ──
    document.getElementById('saveBtn').addEventListener('click', async () => {
        const btn = document.getElementById('saveBtn');
        const errEl = document.getElementById('formError');
        errEl.textContent = 'Saving…';
        errEl.style.color = 'var(--primary)';
        btn.disabled = true;

        try {
            const id = document.getElementById('projectId').value;
            const fileInput = document.getElementById('pThumbnailFile');
            const galleryFileInput = document.getElementById('pGalleryFiles');
            const title = document.getElementById('pTitle').value;
            const slug = document.getElementById('pSlug').value;
            let thumbnailUrl = document.getElementById('pThumbnailUrl').value;

            if (!title || !slug) throw new Error('Title and Slug are required.');

            // Handle thumbnail upload
            if (fileInput.files.length > 0) {
                errEl.textContent = 'Uploading thumbnail…';
                const file = fileInput.files[0];
                const ext = file.name.split('.').pop();
                const fileName = `thumb_${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
                const filePath = `thumbnails/${fileName}`;

                const { error: uploadError } = await sb.storage.from('images').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data: publicUrlData } = sb.storage.from('images').getPublicUrl(filePath);
                thumbnailUrl = publicUrlData.publicUrl;
            }

            // Handle Multiple Gallery uploads
            if (galleryFileInput.files.length > 0) {
                errEl.textContent = `Uploading ${galleryFileInput.files.length} gallery images…`;
                for (const file of galleryFileInput.files) {
                    const ext = file.name.split('.').pop();
                    const fileName = `gal_${Date.now()}_${Math.random().toString(36).substring(2)}.${ext}`;
                    const filePath = `gallery/${fileName}`;

                    const { error: uploadError } = await sb.storage.from('images').upload(filePath, file);
                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = sb.storage.from('images').getPublicUrl(filePath);
                    currentGallery.push(publicUrlData.publicUrl);
                }
            }

            errEl.textContent = 'Updating database…';
            const projectObject = {
                title: title,
                slug: slug,
                description: document.getElementById('pDesc').value,
                tags: document.getElementById('pTags').value.split(',').map(s => s.trim()).filter(Boolean),
                thumbnail: thumbnailUrl,
                images: currentGallery,
                embed: getYoutubeEmbed(document.getElementById('pEmbed').value)
            };

            if (isEditing) {
                const { error } = await sb.from('projects').update(projectObject).eq('id', id);
                if (error) throw error;
            } else {
                // For new projects, automatically set order_index to end
                projectObject.order_index = projectsData.length > 0 ? Math.max(...projectsData.map(p => p.order_index || 0)) + 1 : 0;
                const { error } = await sb.from('projects').insert([projectObject]);
                if (error) throw error;
            }

            errEl.textContent = '';
            editForm.style.display = 'none';
            projectList.style.display = 'block';
            loadProjects();

        } catch (err) {
            errEl.style.color = '#ff6b6b';
            errEl.textContent = err.message;
            console.error(err);
        } finally {
            btn.disabled = false;
        }
    });

    // ── Init ──
    checkSession();
});

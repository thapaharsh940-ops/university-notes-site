import { supabase } from './supabaseClient.js';

// Admin Code
const ADMIN_CODE = 'sahil12345';
let currentUser = null;

// ==================== AUTH FUNCTIONS ====================
window.showAuthModal = function() {
    document.getElementById('auth-modal').style.display = 'flex';
};

window.hideAuthModal = function() {
    document.getElementById('auth-modal').style.display = 'none';
};

window.switchAuthTab = function(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelector('.auth-tab:first-child').classList.add('active');
        document.getElementById('login-form').classList.add('active');
        document.getElementById('auth-title').textContent = 'Login to University Notes';
    } else {
        document.querySelector('.auth-tab:last-child').classList.add('active');
        document.getElementById('signup-form').classList.add('active');
        document.getElementById('auth-title').textContent = 'Create Account';
    }
};

window.handleSignup = async function() {
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (!email || !password || !confirm) {
        alert('Please fill all fields');
        return;
    }

    if (password !== confirm) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) throw error;

        alert('Account created! Please check your email to verify your account.');
        hideAuthModal();
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
        document.getElementById('signup-confirm').value = '';
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.handleLogin = async function() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        alert('Please fill all fields');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        currentUser = data.user;
        updateUIForUser(data.user);
        hideAuthModal();
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        alert('Logged in successfully!');
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.handleLogout = async function() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        currentUser = null;
        updateUIForUser(null);
        alert('Logged out successfully');
    } catch (error) {
        alert('Error logging out: ' + error.message);
    }
};

function updateUIForUser(user) {
    if (user) {
        document.getElementById('login-btn').style.display = 'none';
        document.getElementById('user-info').style.display = 'flex';
        document.getElementById('user-email').textContent = user.email;
        document.getElementById('upload-login-required').style.display = 'none';
        document.getElementById('upload-form-container').style.display = 'block';
    } else {
        document.getElementById('login-btn').style.display = 'block';
        document.getElementById('user-info').style.display = 'none';
        document.getElementById('upload-login-required').style.display = 'block';
        document.getElementById('upload-form-container').style.display = 'none';
    }
}

// Check auth state on load
supabase.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
    updateUIForUser(currentUser);
});

// ==================== NAVIGATION ====================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        showSection(section);
    });
});

function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${sectionName}-section`).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    if (sectionName === 'overview') loadDashboard();
    if (sectionName === 'browse') loadBranches();
    if (sectionName === 'search') loadFilters();
    if (sectionName === 'upload') loadUploadOptions();
    if (sectionName === 'manage') loadManageOptions();
}

function checkAdminCode() {
    const code = prompt('Enter admin code to continue:');
    return code === ADMIN_CODE;
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const { count: total } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true });
        
        const { count: monthly } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', firstDayOfMonth.toISOString());
        
        const { count: todayCount } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        document.getElementById('total-uploads').textContent = total || 0;
        document.getElementById('month-uploads').textContent = monthly || 0;
        document.getElementById('today-uploads').textContent = todayCount || 0;

        const { data: recent } = await supabase
            .from('documents')
            .select('*, subjects(name)')
            .order('created_at', { ascending: false })
            .limit(10);

        const recentList = document.getElementById('recent-list');
        if (recent && recent.length > 0) {
            recentList.innerHTML = recent.map(doc => `
                <div class="recent-item">
                    <span class="recent-title">${doc.title}</span>
                    <span class="file-badge">${doc.file_type || 'file'}</span>
                    <button onclick="downloadFile('${doc.file_url}')" class="download-btn">⬇️</button>
                </div>
            `).join('');
        } else {
            recentList.innerHTML = '<p>No uploads yet</p>';
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// ==================== BROWSE ====================
async function loadBranches() {
    try {
        const { data: branches } = await supabase
            .from('branches')
            .select('*')
            .order('name');

        const branchesList = document.getElementById('branches-list');
        if (branches && branches.length > 0) {
            branchesList.innerHTML = branches.map(branch => `
                <div class="branch-card" onclick="loadSemesters('${branch.id}', '${branch.name}')">
                    <h3>📚 ${branch.name}</h3>
                    <p>${branch.description || ''}</p>
                </div>
            `).join('');
        } else {
            branchesList.innerHTML = '<p>No branches available. Create one in Manage section.</p>';
        }
    } catch (error) {
        console.error('Error loading branches:', error);
    }
}

window.loadSemesters = async function(branchId, branchName) {
    const { data: semesters } = await supabase
        .from('semesters')
        .select('*')
        .eq('branch_id', branchId)
        .order('name');

    const branchesList = document.getElementById('branches-list');
    branchesList.innerHTML = `
        <button onclick="loadBranches()" class="back-btn">← Back to Branches</button>
        <h3>${branchName} - Semesters</h3>
        ${semesters && semesters.length > 0 ? 
            semesters.map(sem => `
                <div class="semester-card" onclick="loadSections('${sem.id}', '${sem.name}')">
                    <h4>📖 ${sem.name}</h4>
                    <p>${sem.description || ''}</p>
                </div>
            `).join('') : 
            '<p>No semesters found</p>'
        }
    `;
};

window.loadSections = async function(semesterId, semesterName) {
    const { data: sections } = await supabase
        .from('sections')
        .select('*')
        .eq('semester_id', semesterId)
        .order('name');

    const branchesList = document.getElementById('branches-list');
    branchesList.innerHTML = `
        <button onclick="loadBranches()" class="back-btn">← Back</button>
        <h3>${semesterName} - Sections</h3>
        ${sections && sections.length > 0 ? 
            sections.map(sec => `
                <div class="section-card" onclick="loadSubjects('${sec.id}', '${sec.name}')">
                    <h4>📂 ${sec.name}</h4>
                    <p>${sec.description || ''}</p>
                </div>
            `).join('') : 
            '<p>No sections found</p>'
        }
    `;
};

window.loadSubjects = async function(sectionId, sectionName) {
    const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('section_id', sectionId)
        .order('name');

    const branchesList = document.getElementById('branches-list');
    branchesList.innerHTML = `
        <button onclick="loadBranches()" class="back-btn">← Back</button>
        <h3>${sectionName} - Subjects</h3>
        ${subjects && subjects.length > 0 ? 
            subjects.map(subj => `
                <div class="subject-card" onclick="loadDocuments('${subj.id}', '${subj.name}')">
                    <h4>📝 ${subj.name}</h4>
                    <p>${subj.description || ''}</p>
                </div>
            `).join('') : 
            '<p>No subjects found</p>'
        }
    `;
};

window.loadDocuments = async function(subjectId, subjectName) {
    const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at', { ascending: false });

    const branchesList = document.getElementById('branches-list');
    branchesList.innerHTML = `
        <button onclick="loadBranches()" class="back-btn">← Back</button>
        <h3>${subjectName} - Documents</h3>
        ${documents && documents.length > 0 ? 
            documents.map(doc => `
                <div class="document-card">
                    <h4>📄 ${doc.title}</h4>
                    <p>${doc.description || ''}</p>
                    <div class="doc-meta">
                        <span class="file-badge">${doc.file_type || 'file'}</span>
                        <span class="file-size">${formatFileSize(doc.file_size)}</span>
                    </div>
                    <button onclick="downloadFile('${doc.file_url}')" class="download-btn">⬇️ Download</button>
                </div>
            `).join('') : 
            '<p>No documents found</p>'
        }
    `;
};

// ==================== SEARCH ====================
async function loadFilters() {
    const { data: branches } = await supabase.from('branches').select('*').order('name');
    const branchFilter = document.getElementById('branch-filter');
    branchFilter.innerHTML = '<option value="">All Branches</option>' + 
        (branches || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    const { data: subjects } = await supabase.from('subjects').select('*').order('name');
    const subjectFilter = document.getElementById('subject-filter');
    subjectFilter.innerHTML = '<option value="">All Subjects</option>' + 
        (subjects || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

window.performSearch = async function() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const subjectFilter = document.getElementById('subject-filter').value;

    let query = supabase
        .from('documents')
        .select('*, subjects(name)');

    if (subjectFilter) {
        query = query.eq('subject_id', subjectFilter);
    }

    const { data: documents } = await query;
    let filtered = documents || [];

    if (searchTerm) {
        filtered = filtered.filter(doc => 
            doc.title.toLowerCase().includes(searchTerm) ||
            (doc.description && doc.description.toLowerCase().includes(searchTerm)) ||
            (doc.subjects?.name && doc.subjects.name.toLowerCase().includes(searchTerm))
        );
    }

    const resultsDiv = document.getElementById('search-results');
    if (filtered.length > 0) {
        resultsDiv.innerHTML = filtered.map(doc => `
            <div class="document-card">
                <h4>📄 ${doc.title}</h4>
                <p>${doc.description || ''}</p>
                <p class="meta">Subject: ${doc.subjects?.name || 'Unknown'}</p>
                <span class="file-badge">${doc.file_type || 'file'}</span>
                <button onclick="downloadFile('${doc.file_url}')" class="download-btn">⬇️ Download</button>
            </div>
        `).join('');
    } else {
        resultsDiv.innerHTML = '<p>No documents found</p>';
    }
};

// ==================== UPLOAD ====================
async function loadUploadOptions() {
    if (!currentUser) {
        document.getElementById('upload-login-required').style.display = 'block';
        document.getElementById('upload-form-container').style.display = 'none';
        return;
    }

    const { data: sections } = await supabase
        .from('sections')
        .select('*, semesters(name, branches(name))')
        .order('name');

    const sectionSelect = document.getElementById('upload-section-select');
    sectionSelect.innerHTML = '<option value="">Choose section...</option>' + 
        (sections || []).map(s => `
            <option value="${s.id}">${s.semesters?.branches?.name || ''} - ${s.semesters?.name || ''} - ${s.name}</option>
        `).join('');

    sectionSelect.onchange = async (e) => {
        const sectionId = e.target.value;
        if (sectionId) {
            const { data: subjects } = await supabase
                .from('subjects')
                .select('*')
                .eq('section_id', sectionId)
                .order('name');

            const subjectSelect = document.getElementById('upload-subject-select');
            subjectSelect.innerHTML = '<option value="">Choose subject...</option>' + 
                (subjects || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    };
}

window.uploadFile = async function() {
    if (!currentUser) {
        alert('Please login to upload files');
        showAuthModal();
        return;
    }

    const sectionId = document.getElementById('upload-section-select').value;
    const subjectId = document.getElementById('upload-subject-select').value;
    const title = document.getElementById('upload-title').value;
    const description = document.getElementById('upload-description').value;
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];

    if (!sectionId || !subjectId || !title || !file) {
        alert('Please fill all required fields and select a file');
        return;
    }

    if (file.size > 52428800) {
        alert('File size must be less than 50MB');
        return;
    }

    try {
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
            .from('university-notes-files')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
            .from('university-notes-files')
            .getPublicUrl(fileName);

        const { error } = await supabase
            .from('documents')
            .insert([{
                section_id: sectionId,
                subject_id: subjectId,
                title: title,
                description: description,
                file_url: urlData.publicUrl,
                file_type: file.type.split('/')[0] || 'file',
                file_size: file.size,
                uploaded_by: currentUser.id
            }]);

        if (error) throw error;

        alert('File uploaded successfully!');
        document.getElementById('upload-title').value = '';
        document.getElementById('upload-description').value = '';
        fileInput.value = '';
    } catch (error) {
        alert('Error uploading file: ' + error.message);
    }
};

// ==================== MANAGE (ADMIN) ====================
async function loadManageOptions() {
    const { data: branches } = await supabase.from('branches').select('*').order('name');
    const semesterBranchSelect = document.getElementById('semester-branch-select');
    semesterBranchSelect.innerHTML = '<option value="">Select Branch</option>' + 
        (branches || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    semesterBranchSelect.onchange = async (e) => {
        const branchId = e.target.value;
        if (branchId) {
            const { data: semesters } = await supabase
                .from('semesters')
                .select('*')
                .eq('branch_id', branchId)
                .order('name');

            const sectionSemesterSelect = document.getElementById('section-semester-select');
            sectionSemesterSelect.innerHTML = '<option value="">Select Semester</option>' + 
                (semesters || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    };

    document.getElementById('section-semester-select').onchange = async (e) => {
        const semesterId = e.target.value;
        if (semesterId) {
            const { data: sections } = await supabase
                .from('sections')
                .select('*')
                .eq('semester_id', semesterId)
                .order('name');

            const subjectSectionSelect = document.getElementById('subject-section-select');
            subjectSectionSelect.innerHTML = '<option value="">Select Section</option>' + 
                (sections || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    };
}

window.createBranch = async function() {
    if (!checkAdminCode()) {
        alert('Invalid admin code');
        return;
    }

    const name = document.getElementById('branch-name').value;
    const description = document.getElementById('branch-desc').value;

    if (!name) {
        alert('Please enter branch name');
        return;
    }

    try {
        const { error } = await supabase
            .from('branches')
            .insert([{ name, description }]);

        if (error) throw error;
        alert('Branch created successfully!');
        document.getElementById('branch-name').value = '';
        document.getElementById('branch-desc').value = '';
        loadManageOptions();
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.createSemester = async function() {
    if (!checkAdminCode()) {
        alert('Invalid admin code');
        return;
    }

    const branchId = document.getElementById('semester-branch-select').value;
    const name = document.getElementById('semester-name').value;
    const description = document.getElementById('semester-desc').value;

    if (!branchId || !name) {
        alert('Please select branch and enter semester name');
        return;
    }

    try {
        const { error } = await supabase
            .from('semesters')
            .insert([{ branch_id: branchId, name, description }]);

        if (error) throw error;
        alert('Semester created successfully!');
        document.getElementById('semester-name').value = '';
        document.getElementById('semester-desc').value = '';
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.createSection = async function() {
    if (!checkAdminCode()) {
        alert('Invalid admin code');
        return;
    }

    const semesterId = document.getElementById('section-semester-select').value;
    const name = document.getElementById('section-name').value;
    const description = document.getElementById('section-desc').value;

    if (!semesterId || !name) {
        alert('Please select semester and enter section name');
        return;
    }

    try {
        const { error } = await supabase
            .from('sections')
            .insert([{ semester_id: semesterId, name, description }]);

        if (error) throw error;
        alert('Section created successfully!');
        document.getElementById('section-name').value = '';
        document.getElementById('section-desc').value = '';
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.createSubject = async function() {
    if (!checkAdminCode()) {
        alert('Invalid admin code');
        return;
    }

    const sectionId = document.getElementById('subject-section-select').value;
    const name = document.getElementById('subject-name').value;
    const description = document.getElementById('subject-desc').value;

    if (!sectionId || !name) {
        alert('Please select section and enter subject name');
        return;
    }

    try {
        const { error } = await supabase
            .from('subjects')
            .insert([{ section_id: sectionId, name, description }]);

        if (error) throw error;
        alert('Subject created successfully!');
        document.getElementById('subject-name').value = '';
        document.getElementById('subject-desc').value = '';
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// ==================== HELPERS ====================
window.downloadFile = function(url) {
    window.open(url, '_blank');
};

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
}

window.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
    supabase.auth.getSession().then(({ data: { session } }) => {
        currentUser = session?.user || null;
        updateUIForUser(currentUser);
    });
});

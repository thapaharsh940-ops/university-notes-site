import { supabase } from './supabaseClient.js';

// Admin Code (required for creating structure)
const ADMIN_CODE = 'sahil12345';

// Navigation
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
    
    // Load data for each section
    if (sectionName === 'overview') loadDashboard();
    if (sectionName === 'browse') loadBranches();
    if (sectionName === 'search') loadFilters();
    if (sectionName === 'upload') loadUploadOptions();
    if (sectionName === 'manage') loadManageOptions();
}

// Check admin code before sensitive operations
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

        // Total uploads
        const { data: total, error: totalError } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true });
        
        // Monthly uploads
        const { data: monthly, error: monthlyError } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', firstDayOfMonth.toISOString());
        
        // Today's uploads
        const { data: todayData, error: todayError } = await supabase
            .from('documents')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', today.toISOString());

        document.getElementById('total-uploads').textContent = total?.length || 0;
        document.getElementById('month-uploads').textContent = monthly?.length || 0;
        document.getElementById('today-uploads').textContent = todayData?.length || 0;

        // Load recent uploads
        const { data: recent } = await supabase
            .from('documents')
            .select('*, subjects(name)')
            .order('created_at', { ascending: false })
            .limit(10);

        const recentList = document.getElementById('recent-list');
        if (recent && recent.length > 0) {
            recentList.innerHTML = recent.map(doc => `
                <div class="recent-item">
                    <span>${doc.title}</span>
                    <span class="file-badge">${doc.file_type || 'file'}</span>
                    <button onclick="downloadFile('${doc.file_url}')" class="download-btn">⬇️ Download</button>
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
        const { data: branches, error } = await supabase
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

async function loadSemesters(branchId, branchName) {
    try {
        const { data: semesters } = await supabase
            .from('semesters')
            .select('*')
            .eq('branch_id', branchId)
            .order('name');

        const branchesList = document.getElementById('branches-list');
        branchesList.innerHTML = `
            <button onclick="loadBranches()">← Back to Branches</button>
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
    } catch (error) {
        console.error('Error loading semesters:', error);
    }
}

async function loadSections(semesterId, semesterName) {
    try {
        const { data: sections } = await supabase
            .from('sections')
            .select('*')
            .eq('semester_id', semesterId)
            .order('name');

        const branchesList = document.getElementById('branches-list');
        branchesList.innerHTML = `
            <button onclick="loadBranches()">← Back</button>
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
    } catch (error) {
        console.error('Error loading sections:', error);
    }
}

async function loadSubjects(sectionId, sectionName) {
    try {
        const { data: subjects } = await supabase
            .from('subjects')
            .select('*')
            .eq('section_id', sectionId)
            .order('name');

        const branchesList = document.getElementById('branches-list');
        branchesList.innerHTML = `
            <button onclick="loadBranches()">← Back</button>
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
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

async function loadDocuments(subjectId, subjectName) {
    try {
        const { data: documents } = await supabase
            .from('documents')
            .select('*')
            .eq('subject_id', subjectId)
            .order('created_at', { ascending: false });

        const branchesList = document.getElementById('branches-list');
        branchesList.innerHTML = `
            <button onclick="loadBranches()">← Back</button>
            <h3>${subjectName} - Documents</h3>
            ${documents && documents.length > 0 ? 
                documents.map(doc => `
                    <div class="document-card">
                        <h4>📄 ${doc.title}</h4>
                        <p>${doc.description || ''}</p>
                        <span class="file-badge">${doc.file_type || 'file'}</span>
                        <span class="file-size">${formatFileSize(doc.file_size)}</span>
                        <button onclick="downloadFile('${doc.file_url}')" class="download-btn">⬇️ Download</button>
                    </div>
                `).join('') : 
                '<p>No documents found</p>'
            }
        `;
    } catch (error) {
        console.error('Error loading documents:', error);
    }
}

// ==================== SEARCH ====================
async function loadFilters() {
    // Load branches for filter
    const { data: branches } = await supabase.from('branches').select('*').order('name');
    const branchFilter = document.getElementById('branch-filter');
    branchFilter.innerHTML = '<option value="">All Branches</option>' + 
        (branches || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    // Load subjects for filter
    const { data: subjects } = await supabase.from('subjects').select('*').order('name');
    const subjectFilter = document.getElementById('subject-filter');
    subjectFilter.innerHTML = '<option value="">All Subjects</option>' + 
        (subjects || []).map(s => `<option value="${s.id}">${s.name}</option>`).join('');
}

window.performSearch = async function() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const branchFilter = document.getElementById('branch-filter').value;
    const subjectFilter = document.getElementById('subject-filter').value;

    let query = supabase
        .from('documents')
        .select('*, subjects(name, sections(name, semesters(name, branches(name))))');

    if (subjectFilter) {
        query = query.eq('subject_id', subjectFilter);
    }

    const { data: documents } = await query;

    let filtered = documents || [];

    // Filter by search term
    if (searchTerm) {
        filtered = filtered.filter(doc => 
            doc.title.toLowerCase().includes(searchTerm) ||
            (doc.description && doc.description.toLowerCase().includes(searchTerm)) ||
            (doc.subjects?.name && doc.subjects.name.toLowerCase().includes(searchTerm))
        );
    }

    // Filter by branch
    if (branchFilter) {
        filtered = filtered.filter(doc => 
            doc.subjects?.sections?.semesters?.branches?.id === branchFilter
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
    // Load sections
    const { data: sections } = await supabase
        .from('sections')
        .select('*, semesters(name, branches(name))')
        .order('name');

    const sectionSelect = document.getElementById('upload-section-select');
    sectionSelect.innerHTML = '<option value="">Choose section...</option>' + 
        (sections || []).map(s => `
            <option value="${s.id}">${s.semesters?.branches?.name || ''} - ${s.semesters?.name || ''} - ${s.name}</option>
        `).join('');

    // Load subjects when section changes
    sectionSelect.addEventListener('change', async (e) => {
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
    });
}

window.uploadFile = async function() {
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

    if (file.size > 52428800) { // 50MB
        alert('File size must be less than 50MB');
        return;
    }

    try {
        // Upload to Supabase Storage
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('university-notes-files')
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('university-notes-files')
            .getPublicUrl(fileName);

        // Save to database
        const { data, error } = await supabase
            .from('documents')
            .insert([{
                section_id: sectionId,
                subject_id: subjectId,
                title: title,
                description: description,
                file_url: urlData.publicUrl,
                file_type: file.type.split('/')[0] || 'file',
                file_size: file.size
            }]);

        if (error) throw error;

        alert('File uploaded successfully!');
        // Clear form
        document.getElementById('upload-title').value = '';
        document.getElementById('upload-description').value = '';
        fileInput.value = '';
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Error uploading file: ' + error.message);
    }
};

// ==================== MANAGE (ADMIN) ====================
async function loadManageOptions() {
    // Load branches for semester dropdown
    const { data: branches } = await supabase.from('branches').select('*').order('name');
    const semesterBranchSelect = document.getElementById('semester-branch-select');
    semesterBranchSelect.innerHTML = '<option value="">Select Branch</option>' + 
        (branches || []).map(b => `<option value="${b.id}">${b.name}</option>`).join('');

    // Load semesters for section dropdown
    semesterBranchSelect.addEventListener('change', async (e) => {
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
    });

    // Load sections for subject dropdown
    document.getElementById('section-semester-select').addEventListener('change', async (e) => {
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
    });
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
        const { data, error } = await supabase
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
        const { data, error } = await supabase
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
        const { data, error } = await supabase
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
        const { data, error} = await supabase
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

// Load dashboard on page load
window.addEventListener('DOMContentLoaded', loadDashboard);

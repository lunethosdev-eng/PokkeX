// Configuración con tu usuario de GitHub
const GITHUB_USERNAME = 'lunethosdev-eng';
const REPO_NAME = 'PokkeX'; // Reemplazar cuando crees el repo si le pones otro nombre
const WEB_APP_URL = '#'; // Coloca aquí la URL de tu Web App / PWA para iPhone si ya la tienes

const API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/releases`;

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar íconos de Lucide
    if (window.lucide) {
        lucide.createIcons();
    }

    // Configurar enlaces del footer
    document.getElementById('github-repo-link').href = `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}`;
    document.getElementById('report-issue-link').href = `https://github.com/${GITHUB_USERNAME}/${REPO_NAME}/issues`;
    document.getElementById('btn-web-app-link').href = WEB_APP_URL;

    // Obtener información de Releases desde la API de GitHub
    fetchReleases();
});

async function fetchReleases() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('No se encontraron releases en GitHub');
        
        const releases = await response.json();

        if (releases.length === 0) {
            renderEmptyState();
            return;
        }

        // 1. Obtener la última versión oficial/estable
        const latestRelease = releases.find(r => !r.prerelease) || releases[0];
        setupMainDownloadBtn(latestRelease);

        // 2. Calcular descargas totales entre todos los releases
        let totalDownloads = 0;
        releases.forEach(rel => {
            rel.assets.forEach(asset => {
                totalDownloads += asset.download_count;
            });
        });

        document.getElementById('metric-version').textContent = latestRelease.tag_name;
        document.getElementById('metric-downloads').textContent = totalDownloads.toLocaleString();

        // 3. Renderizar Changlog
        renderChangelog(latestRelease);

        // 4. Renderizar Historial de Releases (incluyendo Betas y Antiguos)
        renderReleasesList(releases);

    } catch (error) {
        console.warn('Incapaz de cargar la API de GitHub (Repo posiblemente aún no creado):', error);
        renderDemoState();
    }
}

function setupMainDownloadBtn(release) {
    const apkAsset = release.assets.find(asset => asset.name.endsWith('.apk'));
    const btnDownload = document.getElementById('btn-main-download');
    const versionTag = document.getElementById('latest-version-tag');

    if (apkAsset) {
        btnDownload.href = apkAsset.browser_download_url;
        versionTag.textContent = `Versión ${release.tag_name} (${formatBytes(apkAsset.size)})`;
    } else {
        btnDownload.href = release.html_url;
        versionTag.textContent = `Ver Release ${release.tag_name} en GitHub`;
    }
}

function renderChangelog(release) {
    const container = document.getElementById('changelog-container');
    const bodyContent = release.body ? release.body : 'Sin notas de versión especificadas para este release.';
    
    container.innerHTML = `
        <div style="margin-bottom: 12px; font-weight: 600; color: var(--accent-color);">
            Notas de la versión ${release.tag_name} (${new Date(release.published_at).toLocaleDateString()})
        </div>
        <div>${escapeHtml(bodyContent)}</div>
    `;
}

function renderReleasesList(releases) {
    const container = document.getElementById('releases-list-container');
    container.innerHTML = '';

    releases.forEach(rel => {
        const apkAsset = rel.assets.find(a => a.name.endsWith('.apk'));
        const isBeta = rel.prerelease;
        const downloadUrl = apkAsset ? apkAsset.browser_download_url : rel.html_url;

        const card = document.createElement('div');
        card.className = 'glass-card release-item';

        card.innerHTML = `
            <div>
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                    <strong>${escapeHtml(rel.name || rel.tag_name)}</strong>
                    <span class="release-tag-badge ${isBeta ? 'badge-beta' : 'badge-stable'}">
                        ${isBeta ? 'BETA / PRE-RELEASE' : 'ESTABLE'}
                    </span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">
                    Publicado el ${new Date(rel.published_at).toLocaleDateString()}
                </div>
            </div>
            <a href="${downloadUrl}" class="btn-secondary" style="padding: 8px 16px; font-size: 0.85rem;">
                <i data-lucide="download" style="width: 16px; height: 16px;"></i> Descargar
            </a>
        `;

        container.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
}

function renderDemoState() {
    document.getElementById('latest-version-tag').textContent = 'Próximamente versión v1.0.0';
    document.getElementById('metric-version').textContent = 'v1.0.0';
    document.getElementById('metric-downloads').textContent = '0';
    document.getElementById('changelog-container').innerHTML = '<p>Conecta tu repositorio de GitHub para mostrar el changelog automático.</p>';
    document.getElementById('releases-list-container').innerHTML = '<p style="text-align:center; color: var(--text-secondary);">El repositorio aún no ha publicado ningún Release en GitHub.</p>';
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

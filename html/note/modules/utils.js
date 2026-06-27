function highlightText(text, term) {
    if (!term) return escapeHtml(text);
    const regex = new RegExp('(' + escapeRegExp(term) + ')', 'gi');
    return escapeHtml(text).replace(regex, '<mark class="highlight">$1</mark>');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

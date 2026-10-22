export function mount(container) {
  container.innerHTML = `
    <h3 style="font-size: 1rem; margin-bottom: 0.5rem;">How to Deploy & Share</h3>
    <p class="form-hint" style="margin-bottom: 1.25rem;">
      After saving your changes in this Studio, push the repository to GitHub to let Vercel update the live link.
    </p>

    <div style="background: #1e293b; color: #f8fafc; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.85rem; line-height: 1.6; margin-bottom: 1.5rem;">
      git add -A<br/>
      git commit -m "content: update birthday surprise"<br/>
      git push
    </div>

    <p style="font-size: 0.88rem; color: var(--studio-muted); line-height: 1.6;">
      Once pushed, Vercel will automatically build and publish your personalized card in about 60 seconds. You can then copy the URL and send it to her on WhatsApp or Instagram!
    </p>
  `;
}

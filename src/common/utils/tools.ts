export function getPointsFileName(url: string) {
    return url.match(/([^\/]+)\.pcd$/g);
}
